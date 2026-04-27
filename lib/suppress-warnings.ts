// Suppress React 19 ref warnings from external libraries (both client and server)
const suppressRefWarnings = () => {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args: any[]) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Accessing element.ref was removed in React 19') ||
       message.includes('ref is now a regular prop') ||
       message.includes('It will be removed from the JSX Element type'))
    ) {
      return; // Ignora questo warning specifico
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args: any[]) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Accessing element.ref was removed in React 19') ||
       message.includes('ref is now a regular prop') ||
       message.includes('It will be removed from the JSX Element type'))
    ) {
      return; // Ignora questo errore specifico
    }
    originalError.apply(console, args);
  };
};

// Applica sia sul client che sul server
if (typeof window !== 'undefined') {
  // Client-side
  suppressRefWarnings();
} else {
  // Server-side (Node.js)
  suppressRefWarnings();
}

export {}
