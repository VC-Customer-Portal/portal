// Model used to Add Type Defenition to Address 
interface Address {
    id: string;
    line_1: string;
    line_2?: string;
    province: string;
    city: string;
    postal_code: string;
}

export default Address