import { useContext } from 'react'
import { OperationsContext } from './operationsContext'
export { OperationsProvider } from './OperationsProvider'

/** Returns the current operations context, including live state and mutation helpers. */
export const useOperations = () => {
  const context = useContext(OperationsContext)
  if (!context) {
    throw new Error('useOperations must be used within an OperationsProvider')
  }
  return context
}
