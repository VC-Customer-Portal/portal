// Model used to Add Type Defenition to Payment 
interface Payment {
    id: string
    amount: number
    card_number?: string
    expire_date?: string
    cvv?: string
    fullname: string
    email: string
    method_id: number
}

export default Payment;