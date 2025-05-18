import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';


const SignUp = () => {
  return (
    <div className="min-h-screen flex flex-col bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1500673922987-e212871fec22?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")' }}>
      <div className="absolute inset-0 hero-gradient z-0"></div>
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
          <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-center text-primary mb-6">Create Your Account</h2>
            <form className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-primary">Email</label>
                <input type="email" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-primary">Password</label>
                <input type="password" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-primary">Confirm Password</label>
                <input type="password" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
              </div>
              <Button className="w-full bg-primary text-white hover:bg-primary/90 py-2 text-lg rounded">Sign Up</Button>
            </form>
            <p className="mt-6 text-center text-sm text-foreground/80">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">Log In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
