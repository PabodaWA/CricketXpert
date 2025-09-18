import { useLocation } from 'react-router-dom';
import { Search, User, ShoppingCart } from 'lucide-react';

const OrderSummary = () => {
  const location = useLocation();
  const { order } = location.state || { order: { _id: 'ORD123456', status: 'processing', created_at: new Date(), amount: 0, items: [] } };

  return (
    <div className="bg-[#F1F2F7] min-h-screen text-[#36516C] p-8">
      {/* Header */}
      <nav className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <div className="text-2xl font-bold text-[#072679]">CricketExpert.</div>
        <div className="flex space-x-6 text-gray-600">
          <span>home</span>
          <span>menu</span>
          <span>mobile app</span>
          <span>contact us</span>
        </div>
        <div className="flex items-center space-x-4">
          <Search className="w-5 h-5 text-gray-600" />
          <ShoppingCart className="w-5 h-5 text-gray-600" />
          <User className="w-5 h-5 text-gray-600" />
        </div>
      </nav>

      {/* My Orders */}
      <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
        <h2 className="text-xl font-bold mb-6">My Orders</h2>
        
        <div className="border rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center text-2xl">
              🛍️
            </div>
            <div>
              <div className="font-medium">
                {order.items.map(item => item.productId + ' x ' + item.quantity).join(', ')}
              </div>
              <div className="text-sm text-gray-500">Order ID: {order._id}</div>
            </div>
          </div>
          <div className="text-right">
                            <div className="font-bold">LKR {order.amount}.00</div>
            <div className="text-sm text-gray-500">Items: {order.items.length}</div>
          </div>
          <div className="text-center">
            <div className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm capitalize">
              • {order.status}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {new Date(order.created_at).toLocaleDateString()}
            </div>
          </div>
          <button className="bg-[#42ADF5] text-white px-4 py-2 rounded hover:bg-[#2C8ED1] transition-colors">
            Track Order
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white rounded-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-2xl font-bold text-[#42ADF5] mb-4">CricketExpert.</div>
            <p className="text-gray-300 text-sm">
              Your go-to platform for cricket equipment and skill development tools.
            </p>
            <div className="flex space-x-3 mt-4">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">f</div>
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">t</div>
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">in</div>
            </div>
          </div>
          <div>
            <h3 className="font-bold mb-4">COMPANY</h3>
            <div className="space-y-2 text-gray-300 text-sm">
              <div>Home</div>
              <div>About us</div>
              <div>Delivery</div>
              <div>Privacy policy</div>
            </div>
          </div>
          <div>
            <h3 className="font-bold mb-4">GET IN TOUCH</h3>
            <div className="space-y-2 text-gray-300 text-sm">
              <div>+1-212-456-7890</div>
              <div>contact@cricketexpert.dev</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OrderSummary;