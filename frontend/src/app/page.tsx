export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-secondary-900 mb-4">
            Welcome to Smart Technologies Bangladesh
          </h1>
          <p className="text-xl text-secondary-600 mb-8">
            Your premier destination for technology solutions and products
          </p>
          <div className="space-x-4">
            <button className="btn-primary">
              Shop Now
            </button>
            <button className="btn-secondary">
              Learn More
            </button>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">Quality Products</h2>
            <p className="text-secondary-600">
              Premium technology products from leading brands worldwide
            </p>
          </div>
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">Expert Support</h2>
            <p className="text-secondary-600">
              Professional technical support and consultation services
            </p>
          </div>
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">Fast Delivery</h2>
            <p className="text-secondary-600">
              Quick and reliable delivery across Bangladesh
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}