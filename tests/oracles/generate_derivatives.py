"""Regenerate with SymPy 1.14.0: python tests/oracles/generate_derivatives.py.
The app and its math.js/Nerdamer engines are never imported here.
References are evaluated at 60 decimal digits before JSON serialization.
"""
import json
from pathlib import Path
import sympy as s

x = s.Symbol('x', real=True)
functions = [
 'sqrt((x+1)/(x-1))', 'sqrt((x-2)*(x+1))',
 'sqrt((x^2-1)/(x^2-4))', 'sqrt((x^2-4)/(x^2-1))',
 'sqrt((x-1)/(x+2))', 'sqrt((2*x+3)/(3*x-2))',
 'sqrt(x*(x+1))', 'sqrt((ln(x)-2)*(ln(x)-1))',
 'sqrt((exp(x)-2)/(exp(x)-1))', 'sqrt((sin(x)+2)/(cos(x)+2))',
 'ln(sqrt((x+1)/(x-1)))', 'exp(sqrt((x+1)/(x-1)))',
 'sqrt(ln(x)^2+1)', 'sqrt(exp(2*x)+1)',
 'sqrt(x+sqrt(x^2+1))', 'ln(x+sqrt(x^2+1))',
 'sqrt(sqrt(x^2+1)+1)', 'sqrt(sqrt((x+1)/(x-1)))',
 '1/sqrt((x+1)/(x-1))', 'x/sqrt(x^2+1)',
 'sqrt(x^2+1)/(x^2-1)', 'ln(x)/(sqrt(x)+1)',
 'ln(x^2+1)/sqrt(x^2+1)', 'exp(-x^2)/(x^2+1)',
 'exp(x)/(1+exp(x))', 'x*ln(x)/(x-1)',
 'x^2*exp(x)/(x+1)', 'ln(x)^2/x',
 'ln(x)/(x*exp(x))', '(ln(x)+x)/(x^2+1)',
 'ln(ln(x))', 'ln(x^2-2*x+2)',
 'exp(sin(x^2))', 'ln(1+exp(x))', 'sin(ln(x))/(x^2+1)',
 'cos(x^2)*exp(x)/(x+2)', 'tan(x)/(x^2+1)',
 'x^x', '(x^2+1)^x', '(x^2+1)^sin(x)',
 '2^(x^2)', 'exp(x)^sin(x)', '(sqrt(x)+1)^ln(x)',
 'cbrt(x^2+1)', 'cbrt(x^3+1)', 'cbrt((x+1)/(x-1))',
 'cbrt(x^2-4)/(x^2+1)', 'abs(x^2-1)', 'sqrt((x^2-1)^2)',
 'sqrt(x^6)', 'sqrt((x+1)^6)', 'cbrt(x^6)',
 'asin(x/2)', 'acos(x/3)', 'atan(ln(x))',
 'tanh(x^2)', '1/cosh(x)', 'sinh(x)/(cosh(x)+2)',
 'sqrt((x-1/1000)/(x-2/1000))', 'ln(2)*x^3+sqrt(2)*x',
]
points = [s.Rational(v) for v in ['-8','-4','-2.3','-1.4','-.7','-.2','0','.2','.7','1.4','2.3','4','8','1/4','1/2','1','3/2','2','3','5','3/2000']]
def cbrt(u):
 # Known nonnegative radicands use the principal real power directly. This
 # makes cbrt(x^6)=x^2 before differentiating, avoiding the spurious factor
 # sign(x^6) introduced by SymPy's generic real_root representation at zero.
 return s.Pow(u,s.Rational(1,3)) if u.is_nonnegative else s.real_root(u,3)

local = {'x': x, 'ln': s.log, 'cbrt': cbrt, 'abs': s.Abs}
cases = []
for raw in functions:
 f = s.sympify(raw.replace('^','**'), locals=local)
 for order in [1,2,3]:
  d = s.diff(f,x,order)
  values = []
  for at in points:
   # sign(0)=0 in SymPy's formal Abs derivative is not a derivative at a
   # corner. Keep this oracle away from all Abs zeros; dedicated handwritten
   # tests distinguish the smooth zeros of |x|³ from genuine corners.
   if any(s.simplify(a.args[0].subs(x,at)) == 0 for a in f.atoms(s.Abs)):
    continue
   original = f.subs(x,at).evalf(60)
   value = d.subs(x,at).evalf(60)
   if original.is_real is not True or original.is_finite is not True or value.is_real is not True or value.is_finite is not True:
    continue
   # SymPy's distributional derivatives of Abs may contain DiracDelta. They
   # reduce to ordinary derivatives only away from the zeros of its argument.
   if value.has(s.DiracDelta,s.Derivative):
    continue
   values.append({'x': str(at), 'value': str(value)})
  if values:
   cases.append({'expression': raw,'order':order,'values':values})
result = {'generator':'SymPy '+s.__version__, 'precision':60, 'functions':len(functions), 'checks':sum(len(c['values']) for c in cases), 'cases':cases}
Path(__file__).with_name('derivatives.json').write_text(json.dumps(result,ensure_ascii=False,indent=1)+'\n')
print(result['functions'], 'functions,',len(cases),'derivatives,',result['checks'],'references')
