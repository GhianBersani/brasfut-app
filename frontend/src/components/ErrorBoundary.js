// brasfut-app/frontend/src/components/ErrorBoundary.js

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Você também pode registrar o erro em um serviço de relatórios de erros
    console.error("ErrorBoundary capturou um erro:", error, errorInfo);
    // Aqui você pode enviar o erro para um serviço de monitoramento (ex: Sentry)
  }

  render() {
    if (this.state.hasError) {
      // Você pode renderizar qualquer UI de fallback personalizada
      return (
        <div style={{ padding: '20px', border: '1px solid red', color: 'red', backgroundColor: '#ffe6e6' }}>
          <h2>Algo deu muito errado no Brasfut-App!</h2>
          <p>Por favor, tente recarregar a página ou contate o suporte técnico.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;