/// <reference types="vite/client" />

interface ImportMetaEnv {
 readonly VITE_REQUIRE_ACTIVATION?: string;
 readonly VITE_DEMO_ACTIVATION_CODE?: string;
}

interface ImportMeta {
 readonly env: ImportMetaEnv;
}
