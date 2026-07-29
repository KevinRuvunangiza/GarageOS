import { MessageCircle } from 'lucide-react'
import { Button } from './ui/Button'

interface WhatsAppButtonProps {
  phoneNumber: string
  vehicleMake: string
  vehicleModel: string
  licensePlate: string
  totalAmount: number
}

export function WhatsAppButton({ 
  phoneNumber, 
  vehicleMake, 
  vehicleModel, 
  licensePlate, 
  totalAmount 
}: WhatsAppButtonProps) {
  function formatWhatsAppLink(): string {
    // Clean the phone number: remove spaces, dashes, parentheses
    let cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '')

    // Remove leading + if present
    cleanNumber = cleanNumber.replace(/^\+/, '')

    // If number starts with 0, replace with 27 (South Africa example)
    // You can customize this logic based on your region
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '27' + cleanNumber.substring(1)
    }

    const message = `Hello! Your ${vehicleMake} ${vehicleModel} (${licensePlate}) is ready for pickup. Total due: R ${totalAmount.toFixed(2)}. Please come collect your vehicle at your earliest convenience. Thank you!`

    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => window.open(formatWhatsAppLink(), '_blank')}
      className="h-8 px-2 text-xs gap-1 hover:bg-emerald-50 hover:text-emerald-700"
      title="Notify via WhatsApp"
    >
      <MessageCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Notify</span>
    </Button>
  )
}
