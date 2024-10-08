"use client"

import React, { useState, useEffect } from "react"
import { PieChart, Pie, Cell, Label, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import PaymentDialog from "@/components/PaymentDialog"
import Payment from "@/models/Payment"

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"]

const UserPayments: React.FC = () => {
    // Variables to hold states for values
    const sessionToken = sessionStorage.getItem('sessionToken')
    const [loading, setLoading] = useState<boolean>(true)

    // Payment States
    const [payments, setPayments] = useState<Payment[]>([])
    const [creditCardPayments, setCreditCardPayments] = useState<Payment[]>([])
    const [paypalPayments, setPaypalPayments] = useState<Payment[]>([])
    const [stripePayments, setStripePayments] = useState<Payment[]>([])
    const [applePayPayments, setApplePayPayments] = useState<Payment[]>([])

    // Amount States
    const [totalCreditCardAmount, setTotalCreditCardAmount] = useState<number>(0)
    const [totalPaypalAmount, setTotalPaypalAmount] = useState<number>(0)
    const [totalStripeAmount, setTotalStripeAmount] = useState<number>(0)
    const [totalApplePayAmount, setTotalApplePayAmount] = useState<number>(0)

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);


    /*
        Pie Chart and Bar Chart Data
    */
    const pieChartData = [
        { name: "Credit Card", value: creditCardPayments.length },
        { name: "PayPal", value: paypalPayments.length },
        { name: "Stripe", value: stripePayments.length },
        { name: "Apple Pay", value: applePayPayments.length },
    ]

    const barChartData = [
        { name: "Credit Card", amount: totalCreditCardAmount },
        { name: "PayPal", amount: totalPaypalAmount },
        { name: "Stripe", amount: totalStripeAmount },
        { name: "Apple Pay", amount: totalApplePayAmount },
    ]

    // values Shown in PieChart and Bar Chart
    const totalPayments = payments.length
    const totalAmount = barChartData.reduce((sum, entry) => sum + entry.amount, 0)

    // Chart Config
    const chartConfig = {
        creditCard: {
            label: "Credit Card",
            color: COLORS[0],
        },
        paypal: {
            label: "PayPal",
            color: COLORS[1],
        },
        stripe: {
            label: "Stripe",
            color: COLORS[2],
        },
        applePay: {
            label: "Apple Pay",
            color: COLORS[3],
        },
    }

    // Used to show PieChart
    const renderPieChart = () => (
        <Card className="w-full md:w-1/2 m-10 flex-1">
            <CardHeader>
                <CardTitle>Payment Distribution</CardTitle>
                <CardDescription>Distribution of payments by payment method</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <PieChart>
                        <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {pieChartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            <Label
                                content={({ viewBox }) => {
                                    if (!viewBox) return null
                                    const { cx, cy } = viewBox as { cx: number; cy: number }

                                    return (
                                        <text x={cx} y={cy} fill="var(--foreground)" textAnchor="middle" dominantBaseline="central">
                                            <tspan x={cx} y={cy - 10} fontSize="24" fontWeight="bold">
                                                {totalPayments}
                                            </tspan>
                                            <tspan x={cx} y={cy + 15} fontSize="14">
                                                Total Payments
                                            </tspan>
                                        </text>
                                    )
                                }}
                            />
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                </ChartContainer>
                <div className="mt-4 grid grid-cols-2 gap-4 w-full">
                    {pieChartData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center">
                            <div className="w-3 h-3 mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span>{entry.name}: {entry.value}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )


    // Used to Show  BarChart
    const renderBarChart = () => (
        <Card className="w-full md:w-1/2 m-10 flex-1">
            <CardHeader>
                <CardTitle>Total Amount by Payment Method</CardTitle>
                <CardDescription>Total amount of payments for each method</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={barChartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="amount" fill="hsl(var(--chart-1))">
                            {barChartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
                <div className="mt-4 grid grid-cols-2 gap-4 w-full">
                    {barChartData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center">
                            <div className="w-3 h-3 mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span>{entry.name}: <span className="font-bold">R {entry.amount.toFixed(2)}</span></span>
                        </div>
                    ))}
                </div>
                <div className="mt-4 text-center">
                    <strong>Total Amount: R {totalAmount.toFixed(2)}</strong>
                </div>
            </CardContent>
        </Card>
    )


    // Table Columns Config
    const columns: ColumnDef<Payment>[] = [
        {
            accessorKey: "id",
            header: "ID",
        },
        {
            accessorKey: "amount",
            header: "Amount",
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("amount"))
                const formatted = new Intl.NumberFormat("en-ZA", {
                    style: "currency",
                    currency: "ZAR",
                }).format(amount)
                return <div className="font-medium">{formatted}</div>
            },
        },
        {
            accessorKey: "fullname",
            header: "Full Name",
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "method_id",
            header: "Payment Method",
            cell: ({ row }) => {
                const methodId = row.getValue("method_id")
                const methodName = methodId === 1 ? "Credit Card" :
                    methodId === 2 ? "PayPal" :
                        methodId === 3 ? "Stripe" :
                            methodId === 4 ? "Apple Pay" : "Unknown"
                return <div>{methodName}</div>
            },
        },
    ]



    /*
        Used for DataTable Row Click and Dialog Display
    */
    const handleRowClick = (payment: Payment) => {
        setSelectedPayment(payment);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedPayment(null);
    };


    // Config for Table
    const table = useReactTable({
        data: payments,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        initialState: {
            pagination: {
                pageSize: 5,
            }
        }
    })

    // Used to Render the Data Table
    const renderDataTable = () => (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>A list of all payments</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center py-4">
                    <Input
                        placeholder="Filter emails..."
                        value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("email")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                Columns <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id} className="text-center">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        onClick={() => handleRowClick(row.original)}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-end space-x-2 py-4">
                    <div>
                        Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to {Math.min((table.getState().pagination.pageIndex) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length) + table.getState().pagination.pageSize} of {table.getFilteredRowModel().rows.length} rows
                    </div>
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    if (loading) {
        <div className="flex flex-col space-y-3">
            <Skeleton className="h-[200px] w-[400px] rounded-xl" style={{ backgroundColor: '#cde74c' }} />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[400px]" style={{ backgroundColor: '#cde74c' }} />
                <Skeleton className="h-4 w-[400px]" style={{ backgroundColor: '#cde74c' }} />
            </div>
        </div>
    }

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_EXPRESS_URL}/mypayments`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ token: sessionToken })
                })
                const data = await response.json()

                if (response.ok) {
                    const allPayments = data.payments
                    console.log(allPayments)

                    const creditCard = allPayments.filter((payment: Payment) => payment.method_id === 1)
                    const paypal = allPayments.filter((payment: Payment) => payment.method_id === 2)
                    const stripe = allPayments.filter((payment: Payment) => payment.method_id === 3)
                    const applePay = allPayments.filter((payment: Payment) => payment.method_id === 4)

                    setPayments(allPayments)
                    setCreditCardPayments(creditCard)
                    setPaypalPayments(paypal)
                    setStripePayments(stripe)
                    setApplePayPayments(applePay)

                    setTotalCreditCardAmount(parseFloat(creditCard.reduce((sum: number, payment: Payment) => sum + payment.amount, 0).toFixed(2)))
                    setTotalPaypalAmount(parseFloat(paypal.reduce((sum: number, payment: Payment) => sum + payment.amount, 0).toFixed(2)))
                    setTotalStripeAmount(parseFloat(stripe.reduce((sum: number, payment: Payment) => sum + payment.amount, 0).toFixed(2)))
                    setTotalApplePayAmount(parseFloat(applePay.reduce((sum: number, payment: Payment) => sum + payment.amount, 0).toFixed(2)))
                    setTimeout(() => {
                    }, 5000);
                } else {
                    console.error(data.message)
                }
            } catch (error) {
                console.error("Error fetching payments:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchPayments()
    }, [sessionToken])

    return (
        <div className="flex flex-col w-full">
            <div className="flex flex-col md:flex-row w-full">
                {renderPieChart()}
                {renderBarChart()}
            </div>
            <div className="mb-60 m-10 -mt-5">
                {renderDataTable()}
            </div>
            <PaymentDialog
                isOpen={isDialogOpen}
                onClose={handleCloseDialog}
                selectedData={selectedPayment}
            />
        </div>
    )
}

export default UserPayments