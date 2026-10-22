"""Verify the built APK, including the launcher icons actually compiled into it."""
import argparse
import base64
import hashlib
import json
import os
import posixpath
import re
import shutil
import struct
import subprocess
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('apk', type=Path)
parser.add_argument('--aapt2')
parser.add_argument('--apksigner')
args = parser.parse_args()


def build_tool(name, explicit):
    if explicit:
        return explicit
    found = shutil.which(name)
    if found:
        return found
    sdk = os.environ.get('ANDROID_HOME') or os.environ.get('ANDROID_SDK_ROOT')
    candidates = sorted((Path(sdk) / 'build-tools').glob('*/' + name)) if sdk else []
    assert candidates, 'Android build tool unavailable: ' + name
    return str(candidates[-1])


def manifest_nodes(data):
    strings, nodes, offset = [], [], 8
    while offset < len(data):
        kind, header, size = struct.unpack_from('<HHI', data, offset)
        assert size >= header and size > 0
        if kind == 1:
            count, _, flags, start, _ = struct.unpack_from('<IIIII', data, offset + 8)
            offsets = struct.unpack_from('<' + 'I' * count, data, offset + header)

            def length(at, utf8):
                if utf8:
                    n = data[at]
                    return ((((n & 127) << 8) | data[at + 1], at + 2) if n & 128 else (n, at + 1))
                n = struct.unpack_from('<H', data, at)[0]
                return ((((n & 32767) << 16) | struct.unpack_from('<H', data, at + 2)[0], at + 4) if n & 32768 else (n, at + 2))

            for item in offsets:
                at = offset + start + item
                if flags & 256:
                    _, at = length(at, True)
                    count, at = length(at, True)
                    strings.append(data[at:at + count].decode('utf8'))
                else:
                    count, at = length(at, False)
                    strings.append(data[at:at + count * 2].decode('utf-16le'))
        elif kind == 0x102:
            name = strings[struct.unpack_from('<I', data, offset + 20)[0]]
            start, stride, count = struct.unpack_from('<HHH', data, offset + 24)
            attributes = {}
            for index in range(count):
                at = offset + 16 + start + index * stride
                key = strings[struct.unpack_from('<I', data, at + 4)[0]]
                value = struct.unpack_from('<I', data, at + 16)[0]
                attributes[key] = strings[value] if data[at + 15] == 3 else value
            nodes.append((name, attributes))
        offset += size
    return nodes


with zipfile.ZipFile(args.apk) as archive:
    assert archive.testzip() is None, 'Corrupted APK ZIP entry'
    names = set(archive.namelist())
    assert {'AndroidManifest.xml', 'classes.dex', 'assets/public/index.html', 'assets/public/sw.js'} <= names
    assert not any(re.search(r'/ic_launcher(?:[_.])', name) for name in names), 'Old launcher icon still packaged'
    nodes = manifest_nodes(archive.read('AndroidManifest.xml'))
    assert archive.read('assets/public/icon.svg') == (root / 'public/icon.svg').read_bytes(), 'Web icon differs from source'
    assets = [name for name in names if name.startswith('assets/public/') and not name.endswith('/')]
    assert any('/worker-' in name and name.endswith('.js') for name in assets)
    assert any('/VisualEditor-' in name and name.endswith('.js') for name in assets)
    references = 0
    for css in [name for name in assets if name.endswith('.css')]:
        for value in re.findall(r'url\((.*?)\)', archive.read(css).decode()):
            url = value.strip().strip('\"\'').split('#')[0].split('?')[0]
            if not url or url.startswith(('data:', 'http:', 'https:')):
                continue
            target = posixpath.normpath('assets/public' + url if url.startswith('/') else posixpath.join(posixpath.dirname(css), url))
            assert target in names, 'Missing embedded font or CSS asset: ' + target
            references += 1
    assert references > 0

manifest = next(attrs for name, attrs in nodes if name == 'manifest')
application = next(attrs for name, attrs in nodes if name == 'application')
assert application.get('allowBackup') == 0, 'Automatic Android backup must be disabled'
assert application.get('fullBackupContent') and application.get('dataExtractionRules'), 'Explicit backup exclusion rules missing'
gradle = (root / 'android/app/build.gradle').read_text()
version = re.search(r'versionName\s+"([^"]+)"', gradle)[1]
code = int(re.search(r'versionCode\s+(\d+)', gradle)[1])
assert manifest['package'] == 'mg.mathsbac.madagascar'
assert manifest['versionName'] == version and manifest['versionCode'] == code
assert sum(name == 'action' and attrs.get('name') == 'android.intent.action.MAIN' for name, attrs in nodes) == 1
assert sum(name == 'category' and attrs.get('name') == 'android.intent.category.LAUNCHER' for name, attrs in nodes) == 1
assert not any(name == 'activity-alias' for name, _ in nodes), 'Extra launcher alias'

aapt = build_tool('aapt2', args.aapt2)
resources = subprocess.check_output([aapt, 'dump', 'resources', str(args.apk)], text=True)
for name in ['mipmap/maths_bac_launcher', 'mipmap/maths_bac_launcher_round', 'drawable/maths_bac_foreground', 'drawable/maths_bac_monochrome']:
    assert name in resources, 'Missing compiled icon resource: ' + name
for attribute, name in [('icon', 'mipmap/maths_bac_launcher'), ('roundIcon', 'mipmap/maths_bac_launcher_round')]:
    found = re.search(r'resource\s+(0x[0-9a-f]+)\s+' + re.escape(name) + r'(?:\s|$)', resources)
    assert found and application[attribute] == int(found[1], 16), 'Manifest references the wrong ' + attribute
assert 'mipmap-anydpi-v26' in resources and 'mipmap-anydpi-v33' in resources, 'Adaptive or monochrome icon variant missing'
with zipfile.ZipFile(args.apk) as archive:
    for name, repeat in [('backup_rules', 1), ('data_extraction_rules', 2)]:
        assert 'xml/' + name in resources, 'Compiled privacy rule missing: ' + name
        rules = manifest_nodes(archive.read('res/xml/' + name + '.xml'))
        excluded = [attributes for tag, attributes in rules if tag == 'exclude']
        for domain in ['root', 'file', 'database', 'sharedpref', 'external']:
            assert sum(a.get('domain') == domain and a.get('path') == '.' for a in excluded) == repeat, 'Incomplete backup exclusions: ' + domain

signature = subprocess.check_output([build_tool('apksigner', args.apksigner), 'verify', '--verbose', '--print-certs-pem', str(args.apk)], text=True)
# Hash the certificate bytes rather than a version-dependent signer label.
pem = re.findall(r'-----BEGIN CERTIFICATE-----\s*([A-Za-z0-9+/=\s]+?)\s*-----END CERTIFICATE-----', signature)
certificates = {hashlib.sha256(base64.b64decode(re.sub(r'\s+', '', value), validate=True)).hexdigest() for value in pem}
assert len(certificates) == 1, 'Expected one signing certificate in apksigner output: ' + signature
certificate = certificates.pop()
print(json.dumps({'apk': str(args.apk.resolve()), 'version': version, 'versionCode': code, 'package': manifest['package'], 'bytes': args.apk.stat().st_size, 'sha256': hashlib.sha256(args.apk.read_bytes()).hexdigest(), 'certificateSha256': certificate, 'assets': len(assets), 'fontReferencesChecked': references, 'launcherEntries': 1, 'compiledIconsVerified': True, 'signatureVerified': True}))
