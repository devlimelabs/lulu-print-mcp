export class FirestoreError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'unknown') {
    super(message);
    this.name = 'FirestoreError';
    this.code = code;
  }
}

export function handleFirestoreError(error: any): FirestoreError {
  if (error instanceof FirestoreError) {
    return error;
  }
  
  let message = 'An unknown error occurred';
  let code = 'unknown';
  
  if (error instanceof Error) {
    message = error.message;
    
    // Extract Firestore error code if available
    if ('code' in error) {
      code = error.code;
    }
  }
  
  return new FirestoreError(message, code);
}

export function formatError(error: any): string {
  const firestoreError = handleFirestoreError(error);
  return `${firestoreError.code}: ${firestoreError.message}`;
}