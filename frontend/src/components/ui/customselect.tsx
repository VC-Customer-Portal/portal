// CustomSelect.tsx
import React from 'react';

interface Address {
    id: string;
    line_1: string;
    line_2?: string;
    province: string;
    city: string;
    postal_code: string;
}

interface CustomSelectProps {
    addresses: Address[];
    selectedValue: string;
    onValueChange: (address: Address | null) => void;
    disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ addresses, selectedValue, onValueChange, disabled }) => {
    return (
        <div>
            <select
                value={selectedValue}
                onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedAddress = addresses.find(address => address.id === selectedId);
                    console.log('Selected ID:', selectedId); // Log the selected ID
                    console.log('Selected Address:', selectedAddress); // Log the selected address
                    console.log('Available Addresses:', addresses); // Log available addresses
                    onValueChange(selectedAddress || null); // Pass the entire address or null
                }}
                disabled={disabled}
                style={{
                    border: '1px solid black',
                    borderRadius: '4px',
                    padding: '8px',
                    width: '350px',
                    fontSize: '16px',
                    cursor: disabled ? 'not-allowed' : 'pointer'
                }}
            >
                <option value="">Select an Address</option>
                {addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                        {address.line_1}, {address.city}, {address.province}, {address.postal_code}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default CustomSelect;
