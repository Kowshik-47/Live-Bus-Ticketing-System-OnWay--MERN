import { useState } from 'react'
import { Bus, Link, Loader2, User } from 'lucide-react'
import { Card, CardTitle, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SignUp() {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [emailId, setEmailId] = useState('')
    const [emailError, setEmailError] = useState('')
    const [password, setPassword] = useState('')
    const [phone, setPhoneNo] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [confirmPassword, setConfPassword] = useState('')
    const [confirmPasswordError, setConfPasswordError] = useState('')
    const [nameError, setNameError] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [error, setError] = useState('')
    let loading = false
    const navigate = useNavigate()

    function isPhoneValid() {
        const pattern = /^[6-9][0-9]+$/

        if (!pattern.test(phone) || phone.length != 10) { setPhoneError('Invalid Phone Number'); return false }
        else { setPhoneError(''); return true }
    }

    function isNameValid() {
        if (firstName.length < 6) { setNameError('First Name length must be greater than 6'); return false }
        else if (lastName.length < 1) { setNameError("Last Name can't be Empty"); return false }
        else { setNameError(""); return true }
    }

    function isEmailValid() {
        const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!pattern.test(emailId)) { setEmailError('Invalid Email Id'); return false }
        else { setEmailError(''); return true }
    }

    function isPasswordValid() {
        if (!password.match(/[0-9]/)) { setPasswordError('Password must contain a Digit'); return false }
        else if (!password.match(/[a-z]/)) { setPasswordError('Password must contain a Small letter'); return false }
        else if (!password.match(/[A-Z]/)) { setPasswordError('Password must contain a Capital Letter'); return false }
        else if (!password.match(/[@#$&_-]/)) { setPasswordError('Password must contain a Special Character(@#$_-&)'); return false }
        else if (password.length < 8) { setPasswordError('Password must contain atleast 8 Characters'); return false }
        else { setPasswordError(''); return true }
    }

    function isConfPasswordValid() {
        if (password === confirmPassword) { setConfPasswordError(''); return true }
        else { setConfPasswordError('Password not matched'); return false }
    }

    async function signUp(e) {
        e.preventDefault()

        if (isEmailValid() && isNameValid() && isConfPasswordValid() && isPasswordValid()) {
            const userData = {
                name: firstName + ' ' + lastName,
                emailId: emailId,
                password: password,
                role: 'passenger',
                phone: phone
            }
            loading = true
            const response = await fetch('/api/auth/register', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            })

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message)
            }

            loading = false
            navigate('/')
        }
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-2 flex-col'>
            <div className="text-center mb-4">
                <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="bg-primary p-3 rounded-xl">
                        <Bus className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">OnWay</h1>
                </div>
                <p className="text-muted-foreground">Smart Ticketing System</p>
            </div>
            <div className="flex items-center justify-center">
                <Card className="flex flex-col bg-white rounded-lg p-6 m-2 text-center w-80 shadow">
                    <CardHeader className="text-center">
                        <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-1">
                            <User className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle>Sign Up</CardTitle>
                    </CardHeader>
                    <form onSubmit={signUp}>
                        <div className="flex m-1 p-1 flex-col">
                            <div onBlur={isNameValid} className='flex'>
                                <input id="firstName" placeholder="First Name" required
                                    className="border border-black rounded p-2 m-1 w-7/12"
                                    onChange={(e) => setFirstName(e.target.value)} />

                                <input id="lastName" placeholder="Last Name" required
                                    className="border border-black rounded p-2 m-1 w-5/12"
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                            {nameError && <label className="text-xs text-red-600 text-left pl-2">{nameError}</label>}
                        </div>
                        <div className="flex m-1 p-1 flex-col" onBlur={isEmailValid}>
                            <input id="email" placeholder="Email" required
                                type='text'
                                className="border border-black rounded p-2 m-1"
                                onChange={(e) => setEmailId(e.target.value)} />

                            {emailError && <label className="text-xs text-red-600 text-left pl-2">{emailError}</label>}
                        </div>
                        <div className="flex m-1 p-1 flex-col" onBlur={isPhoneValid}>
                            <input id="phone" placeholder="Phone No" required
                                type='tel'
                                className="border border-black rounded p-2 m-1"
                                onChange={(e) => setPhoneNo(e.target.value)} />

                            {phoneError && <label className="text-xs text-red-600 text-left pl-2">{phoneError}</label>}
                        </div>
                        <div className="flex m-1 p-1 flex-col" onBlur={isPasswordValid}>
                            <input id="passwd" placeholder="Password" required
                                type='password'
                                className="border border-black rounded p-2 m-1"
                                onChange={(e) => setPassword(e.target.value)} />

                            {passwordError && <label className="text-xs text-red-600 text-left pl-2">{passwordError}</label>}
                        </div>
                        <div className="flex m-1 p-1 flex-col" onBlur={isConfPasswordValid}>
                            <input id="conf-passwd" placeholder="Confirm Password" required
                                type='password'
                                className="border border-black rounded p-2 m-1"
                                onChange={(e) => setConfPassword(e.target.value)} />

                            {confirmPasswordError && <label className="text-xs text-red-600 text-left pl-2">{confirmPasswordError}</label>}
                        </div>
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full m-1"
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    Signing Up...
                                </>
                            ) : (
                                "Sign Up"
                            )}
                        </Button>
                        <div>Already have an account? <a href='/'>Login</a></div>
                    </form>
                </Card>
            </div>
        </div>
    )
}