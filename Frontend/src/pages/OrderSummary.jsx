import { useLocation } from 'react-router-dom';
import { Search, User, ShoppingCart } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const OrderSummary = () => {
  const location = useLocation();
  const { order } = location.state || { order: { _id: 'ORD123456', status: 'processing', created_at: new Date(), amount: 0, items: [] } };

  return (
    <div className="bg-[#F1F2F7] min-h-screen text-[#36516C]">
      <Header />

      {/* My Orders */}
      <div className="bg-white rounded-lg p-6 shadow-sm mb-8 mx-8">
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

      <Footer />
    </div>
  );
};

export default OrderSummary;