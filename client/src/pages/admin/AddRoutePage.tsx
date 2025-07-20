import { CardContent, Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Bus } from 'lucide-react'
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddRoutePage() {
    const [routeNo, setRouteNo] = useState('')
    const [from, setFrom] = useState('')
    const [to, setTo] = useState('')
    const [distance, setDistance] = useState(0)
    const [error, setError] = useState('')
    const [stops, setStops] = useState([{ stop: '', distance: '' }]);

    const navigate = useNavigate()
    const u = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!u || !token) {
        navigate('/')
    }
    const user = JSON.parse(u)

    function addStop() {
        if (stops[stops.length - 1].distance != '' && stops[stops.length - 1].stop != '')
            setStops([...stops, { stop: '', distance: '' }]);
    };

    function setCost(index, e) {
        const updatedStops = [...stops];
        updatedStops[index].distance = e.target.value;
        setStops(updatedStops);
    };

    function setStop(index, e) {
        const updatedStops = [...stops];
        updatedStops[index].stop = e.target.value;
        setStops(updatedStops);
    };

    async function addRoute(e) {
        e.preventDefault()

        const newRoute = {
            routeNo: user.division + '-' + routeNo,
            from: from,
            to: to,
            distance: distance,
            stops: stops
        }

        await fetch('/api/protected/admin/routes', {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(newRoute),
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-2">
            <div className="w-full max-w-md">
                <Card className="shadow-lg flex flex-col">
                    <CardHeader className="text-center">
                        <div className="bg-primary/50 p-3 rounded-full w-fit mx-auto">
                            <Bus />
                        </div>
                        <CardTitle>Add Route</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form>
                            <div className="space-y-2 m-2">
                                <Label>Route Number</Label>
                                <Input type='text' id='route-number' required
                                    onChange={(e) => setRouteNo(e.target.value)}></Input>
                            </div>
                            <div className="space-y-2 m-2">
                                <Label>From</Label>
                                <Input type='text' id='from' placeholder="From" required
                                    onChange={(e) => setFrom(e.target.value)}></Input>
                            </div>
                            <div className="space-y-2 m-2">
                                <Label>To</Label>
                                <Input type='text' id='to' placeholder="To" required
                                    onChange={(e) => setTo(e.target.value)}></Input>
                            </div>
                            <div className="space-y-2 m-2">
                                <Label>Distance</Label>
                                <Input type='number' id='Distance' placeholder="Distance in Kms" required
                                    onChange={(e) => setDistance(parseInt(e.target.value))}></Input>
                            </div>
                            <Card>
                                <div className="m-2">
                                    <div className="flex justify-between">
                                        <h6>Stopings (exclude From and To)</h6>
                                        <Button onClick={addStop} >
                                            <Plus></Plus>
                                            Add Stop
                                        </Button>
                                    </div>
                                </div>
                                {stops.map((item, index) => (
                                    <div className="space-y-2 m-2" key={index}>
                                        <Label>Stop 1</Label>
                                        <div className="flex justify-between">
                                            <Input type='text' placeholder={`Stop ${index + 1}`} className="m-1" name='stop'
                                                onChange={(e) => setStop(index, e)} required></Input>
                                            <Input type='text' placeholder={`Fare ${index + 1}`} className="m-1"
                                                onChange={(e) => setCost(index, e)}></Input>
                                        </div>
                                    </div>
                                )
                                )}
                            </Card>
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2 m-2">
                                <Button onClick={(e) => addRoute(e)} className="w-full">
                                    <Plus />Add Route
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}