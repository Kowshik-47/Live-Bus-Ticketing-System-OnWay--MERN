import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Trash2, Plus, Save, Bus, ArrowLeft, LogOut } from "lucide-react"

export default function RouteDetailsPage() {
    const { routeId } = useParams()
    const token = localStorage.getItem("token")
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    const [routeData, setRouteData] = useState({
        routeNo: "",
        from: "",
        to: "",
        distance: "",
        stops: [{ stop: "", distance: "" }],
    })

    useEffect(() => {
        fetchRoute()
    }, [routeId])

    const fetchRoute = async () => {
        const res = await fetch(`/api/protected/admin/routes/${routeId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        const data = await res.json()
        if (res.ok) {
            setRouteData({
                routeNo: data.routeNo || "",
                from: data.from || "",
                to: data.to || "",
                distance: data.distance?.toString() || "",
                stops: data.stops?.length ? data.stops : [{ stop: "", distance: "" }],
            })
        }
        setLoading(false)
    }

    const updateRoute = async () => {
        const res = await fetch(`/api/protected/admin/routes/${routeId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ...routeData,
                distance: Number(routeData.distance),
                stops: routeData.stops.map((s) => ({
                    stop: s.stop,
                    distance: Number(s.distance),
                })),
            }),
        })

        if (res.ok) {
            alert("✅ Route updated successfully!")
            setRouteData(await res.json())
        } else {
            alert("❌ Failed to update route.")
        }
    }

    const handleStopChange = (i: number, field: "stop" | "distance", value: string) => {
        const updatedStops = [...routeData.stops]
        updatedStops[i][field] = value
        setRouteData({ ...routeData, stops: updatedStops })
    }

    const addStop = () => {
        if (routeData.stops[routeData.stops.length - 1].stop !== '' ||
            routeData.stops[routeData.stops.length - 1].distance !== ''
        ) {
            setRouteData({
                ...routeData,
                stops: [...routeData.stops, { stop: "", distance: "" }],
            })
        }
    }

    const removeStop = (i: number) => {
        const updatedStops = [...routeData.stops]
        updatedStops.splice(i, 1)
        setRouteData({ ...routeData, stops: updatedStops })
    }

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const handleBackToAdmin = () => {
        navigate("/admin");
    };

    if (loading) return <div className="p-6">Loading...</div>

    return (
        <div className="p-6 space-y-6">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Button variant="outline" onClick={handleBackToAdmin}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                            </Button>
                            <div className="bg-primary p-2 rounded-xl">
                                <Bus className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">
                                    Bus Management - {routeData.routeNo}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Detailed bus and trip management
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold">Edit Route</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            placeholder="Route Number"
                            value={routeData.routeNo}
                            onChange={(e) => setRouteData({ ...routeData, routeNo: e.target.value })}
                        />
                        <Input
                            placeholder="Distance (km)"
                            type="number"
                            value={routeData.distance}
                            onChange={(e) => setRouteData({ ...routeData, distance: e.target.value })}
                        />
                        <Input
                            placeholder="From"
                            value={routeData.from}
                            onChange={(e) => setRouteData({ ...routeData, from: e.target.value })}
                        />
                        <Input
                            placeholder="To"
                            value={routeData.to}
                            onChange={(e) => setRouteData({ ...routeData, to: e.target.value })}
                        />
                    </div>

                    <div className="mt-6 space-y-4">
                        <h3 className="font-semibold">Stops</h3>
                        {routeData.stops.map((s, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <Input
                                    placeholder="Stop"
                                    value={s.stop}
                                    onChange={(e) => handleStopChange(i, "stop", e.target.value)}
                                />
                                <Input
                                    placeholder="Distance from Start (km)"
                                    type="number"
                                    value={s.distance}
                                    onChange={(e) => handleStopChange(i, "distance", e.target.value)}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeStop(i)}
                                    disabled={routeData.stops.length === 1}
                                >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        ))}

                        <Button variant="outline" onClick={addStop}>
                            <Plus className="w-4 h-4 mr-1" /> Add Stop
                        </Button>
                    </div>

                    <div className="pt-6">
                        <Button onClick={updateRoute}>
                            <Save className="w-4 h-4 mr-2" /> Save Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}