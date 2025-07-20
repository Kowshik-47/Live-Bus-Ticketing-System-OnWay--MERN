import { CardContent, Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Bus } from 'lucide-react'
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from '../../interceptors/api'

export default function AddBusPage() {
    const [error, setError] = useState('')
    const [vehicleNo, setVehicleNo] = useState('')
    const [model, setModel] = useState('')
    const [capacity, setCapacity] = useState(0)
    const navigate = useNavigate()

    const u = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!u || !token) {
        navigate('/')
    }
    const user = JSON.parse(u)

    async function addBus(e) {
        e.preventDefault()

        if (!vehicleNo || !model || !capacity) {
            setError('Enter All necessary Details')
            return false
        }
        const pattern = /[A-Z]{2} [0-9]{1,2} [A-Z]{1,2} [0-9]{4,4}/
        if (!pattern.test(vehicleNo)) {
            setError('Invalid Vehicle Number')
            return false
        } else if (model.match(/[^A-Z0-9]+/)) {
            setError('Invalid Model Number')
            return false
        } else if (capacity < 0 || capacity > 100) {
            setError('Invalid seat Capacity')
            return false
        } else {
            setError(null)
            const newBus = {
                vehicleNo: vehicleNo,
                model: model,
                capacity: capacity,
                division: user?.division || 'TN'
            }

            const response = await api.post('/protected/admin/addbus', newBus)
            fetch('/api/protected/admin/addbus', {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newBus),
            })
        }

    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-2">
                <div className="w-full max-w-md">
                    <Card className="shadow-lg flex flex-col">
                        <CardHeader className="text-center">
                            <div className="bg-primary/50 p-3 rounded-full w-fit mx-auto">
                                <Bus />
                            </div>
                            <CardTitle>Add Bus</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form>
                                <div className="space-y-2 m-2">
                                    <Label>Vehicle Number</Label>
                                    <Input type='text' id='vehicle-number'
                                        onChange={(e) => setVehicleNo(e.target.value)} placeholder="TN 67 N 8765"></Input>
                                </div>
                                <div className="space-y-2 m-2">
                                    <Label>Model</Label>
                                    <Input type='text' id='model'
                                        onChange={(e) => setModel(e.target.value)}></Input>
                                </div>
                                <div className="space-y-2 m-2">
                                    <Label>Capacity</Label>
                                    <Input type='number' id='capacity'
                                        onChange={(e) => setCapacity(parseInt(e.target.value))}></Input>
                                </div>
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2 m-2">
                                    <Button onClick={(e) => addBus(e)} className="w-full">
                                        <Plus />Add Bus
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}