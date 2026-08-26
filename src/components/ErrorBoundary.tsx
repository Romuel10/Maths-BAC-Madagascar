import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { failed: boolean }

export class ErrorBoundary extends Component<Props, State> {
 state: State = { failed: false };

 static getDerivedStateFromError(): State {
  return { failed: true };
 }

 componentDidCatch(error: Error, info: ErrorInfo) {
  if (import.meta.env.DEV) console.error('Erreur d’interface', error, info);
 }

 render() {
  if (!this.state.failed) return this.props.children;
  return (
   <main className="error-fallback" role="alert">
    <div className="surface p-5">
     <p className="eyebrow">Erreur d’affichage</p>
     <h1 className="page-title">L’application n’a pas pu afficher cet écran.</h1>
     <p className="page-copy">Tes données locales sont conservées. Recharge l’application pour reprendre.</p>
     <button className="btn btn-primary w-full mt-4" onClick={() => window.location.reload()}>Recharger l’application</button>
    </div>
   </main>
  );
 }
}
