import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRepairRequests, getAllTechnicians } from '../api/repairRequestApi';
import Brand from '../brand';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Using shared Brand from ../brand

const StatCard = ({ title, value, icon, note, bgColor, textColor }) => (
  <div className="rounded-xl shadow-lg p-6 border border-gray-200" style={{ backgroundColor: bgColor }}>
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-sm font-semibold" style={{ color: textColor }}>{title}</h4>
      <div className="text-2xl bg-white/20 rounded-lg p-2">{icon}</div>
    </div>
    <div className="text-4xl font-bold mb-1" style={{ color: textColor }}>{value}</div>
    {note && <div className="text-xs opacity-80" style={{ color: textColor }}>{note}</div>}
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [repairRequests, setRepairRequests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  };

  const loadData = async () => {
    try {
      // Load repair requests
      const requestsRes = await getAllRepairRequests();
      setRepairRequests(requestsRes.data || []);
      
      // Load technicians
      try {
        const techniciansRes = await getAllTechnicians();
        setTechnicians(techniciansRes.data || []);
      } catch (techError) {
        console.error('Error loading technicians:', techError);
        setTechnicians([]);
      }
    } catch (error) {
      console.error('Error loading repair requests:', error);
      setRepairRequests([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F1F2F7' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#42ADF5' }}></div>
          <p className="mt-4" style={{ color: '#36516C' }}>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F1F2F7' }}>
      <Header />
      {/* Main Content */}
      <main className="flex-1 p-8 relative">
        {/* Sidebar Toggle Button - Left Corner */}
        <div className="absolute top-0 left-0 z-50">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            style={{ backgroundColor: '#072679', color: 'white' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

      {/* Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowSidebar(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
        showSidebar ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold" style={{ color: '#072679' }}>Repair Management</h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <nav className="space-y-2 flex-1">
                         <button
               onClick={() => {
                 navigate('/manager');
                 setShowSidebar(false);
               }}
               className="w-full text-left px-4 py-3 rounded-lg font-medium text-gray-700 hover:text-white transition-colors flex items-center space-x-3"
               onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#42ADF5'; }}
               onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2-2z" />
                 <path strokeLinecap="round" strokeLinejoin="round" d="M8 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6H8V5z" />
               </svg>
               <span>Manager View</span>
             </button>
             <button
               onClick={() => {
                 navigate('/new-technician');
                 setShowSidebar(false);
               }}
               className="w-full text-left px-4 py-3 rounded-lg font-medium text-gray-700 hover:text-white transition-colors flex items-center space-x-3"
               onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#42ADF5'; }}
               onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM3 20a6 6 0 0 1 12 0v1H3v-1z" />
               </svg>
               <span>New Technician</span>
             </button>
          </nav>
          
          {/* Logout Button at Bottom */}
          <div className="mt-auto pt-4 border-t border-gray-200">
                                      <button
               onClick={() => {
                 localStorage.removeItem('cx_current_user');
                 navigate('/');
                 setShowSidebar(false);
               }}
                               className="w-full text-left px-4 py-3 rounded-lg font-medium text-gray-700 hover:text-white transition-colors flex items-center space-x-3"
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fecaca'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                                 <svg className="w-6 h-6" fill="none" stroke="#ef4444" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                </svg>
                                 <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Logout</span>
             </button>
          </div>
        </div>
      </aside>

                               {/* Heading */}
         <div className="mb-8 mt-20">
           <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
             <div className="flex items-center justify-between">
               <div>
                 <h1 className="text-4xl font-bold" style={{ color: '#000000' }}>
                   Overview of Repair
                 </h1>
                 <p className="mt-2 text-lg" style={{ color: '#36516C' }}>
                   Comprehensive overview of repair operations and performance metrics
                 </p>
               </div>
               <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#072679' }}>
                 <span className="text-white text-2xl">🔧</span>
               </div>
             </div>
           </div>
         </div>

                     {/* Stat Cards */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
             <StatCard 
               title="Total Requests" 
               value={repairRequests.length} 
               icon="📦" 
               note="All time" 
               bgColor="#072679"
               textColor="#F1F2F7"
             />
             <StatCard 
               title="Pending" 
               value={repairRequests.filter(r => r.status === 'Pending').length} 
               icon="⏳" 
               note="Awaiting review" 
               bgColor="#42ADF5"
               textColor="#F1F2F7"
             />
             <StatCard 
               title="In Progress" 
               value={repairRequests.filter(r => r.status === 'In Repair' || r.status === 'Halfway Completed').length} 
               icon="🔧" 
               note="Assigned to technicians" 
               bgColor="#D88717"
               textColor="#F1F2F7"
             />
             <StatCard 
               title="Completed" 
               value={repairRequests.filter(r => r.status === 'Ready for Pickup').length} 
               icon="✅" 
               note="Ready for pickup" 
               bgColor="#36516C"
               textColor="#F1F2F7"
             />
           </div>

                       {/* Additional Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard 
                title="Customer Approved" 
                value={repairRequests.filter(r => r.status === 'Customer Approved').length} 
                icon="👍" 
                note="Ready to assign" 
                bgColor="#36516C"
                textColor="#F1F2F7"
              />
              <StatCard 
                title="Rejected" 
                value={repairRequests.filter(r => r.status === 'Rejected' || r.status === 'Customer Rejected').length} 
                icon="❌" 
                note="Not proceeding" 
                bgColor="#D88717"
                textColor="#F1F2F7"
              />
            </div>

                     {/* Charts */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
             <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl transition-all duration-300">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-bold" style={{ color: '#000000' }}>📈 Requests Trend</h3>
                 <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#42ADF5' }}>
                   <span className="text-white text-lg">📊</span>
                 </div>
               </div>
               <div className="h-64 flex items-end justify-between px-6 py-4 bg-gray-50 rounded-xl">
                 {(() => {
                   // Calculate monthly data for the last 6 months
                   const months = [];
                   const now = new Date();
                   for (let i = 5; i >= 0; i--) {
                     const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
                     const monthName = month.toLocaleDateString('en-US', { month: 'short' });
                     const monthRequests = repairRequests.filter(request => {
                       const requestDate = new Date(request.createdAt);
                       return requestDate.getMonth() === month.getMonth() && 
                              requestDate.getFullYear() === month.getFullYear();
                     }).length;
                     months.push({ name: monthName, count: monthRequests });
                   }
                   
                   return months.map((month, i) => (
                     <div key={i} className="relative group flex flex-col items-center">
                       <div 
                         className="w-10 rounded-t-lg transition-all duration-300 hover:scale-110 cursor-pointer shadow-lg" 
                         style={{ 
                           height: `${Math.max(month.count * 8, 20)}px`, 
                           backgroundColor: i % 2 === 0 ? '#42ADF5' : '#072679'
                         }}
                       />
                       <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                         {month.count}
                       </div>
                       <div className="mt-2 text-xs text-gray-600">{month.name}</div>
                     </div>
                   ));
                 })()}
               </div>
               <div className="mt-4 text-sm font-medium" style={{ color: '#36516C' }}>📅 Last 6 months performance</div>
             </div>
             
             <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl transition-all duration-300">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-bold" style={{ color: '#000000' }}>🎯 Status Distribution</h3>
                 <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#072679' }}>
                   <span className="text-white text-lg">📊</span>
                 </div>
               </div>
               <div className="h-64 flex items-center justify-center relative">
                 <div className="relative" style={{ width: 240, height: 240 }}>
                   <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                     <path d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831
                       a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" strokeWidth="4" />
                     <path d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#42ADF5" strokeWidth="4" strokeDasharray="40 60" strokeLinecap="round" />
                     <path d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#D88717" strokeWidth="4" strokeDasharray="20 80" strokeDashoffset="40" strokeLinecap="round" />
                     <path d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#36516C" strokeWidth="4" strokeDasharray="15 85" strokeDashoffset="60" strokeLinecap="round" />
                   </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                       <div className="text-center">
                         <div className="text-3xl font-bold" style={{ color: '#000000' }}>{repairRequests.length}</div>
                         <div className="text-sm" style={{ color: '#36516C' }}>Total</div>
                       </div>
                     </div>
                 </div>
               </div>
                                <div className="grid grid-cols-3 gap-4 mt-6">
                   <div className="text-center">
                     <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: '#42ADF5' }}></div>
                     <div className="text-sm font-medium" style={{ color: '#36516C' }}>Pending</div>
                     <div className="text-lg font-bold" style={{ color: '#000000' }}>{repairRequests.filter(r => r.status === 'Pending').length}</div>
                   </div>
                   <div className="text-center">
                     <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: '#36516C' }}></div>
                     <div className="text-sm font-medium" style={{ color: '#36516C' }}>Completed</div>
                     <div className="text-lg font-bold" style={{ color: '#000000' }}>{repairRequests.filter(r => r.status === 'Ready for Pickup').length}</div>
                   </div>
                   <div className="text-center">
                     <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: '#D88717' }}></div>
                     <div className="text-sm font-medium" style={{ color: '#36516C' }}>In Progress</div>
                     <div className="text-lg font-bold" style={{ color: '#000000' }}>{repairRequests.filter(r => r.status === 'In Repair' || r.status === 'Halfway Completed').length}</div>
                   </div>
                 </div>
             </div>
           </div>

                                 {/* Quick Actions Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold" style={{ color: '#000000' }}>⚡ Quick Actions</h3>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#D88717' }}>
                  <span className="text-white text-lg">⚡</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div 
                  onClick={() => navigate('/manager')}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: '#42ADF5' }}>
                      <span className="text-white text-xl">🔧</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg" style={{ color: '#000000' }}>View Requests</h4>
                      <p className="text-sm" style={{ color: '#36516C' }}>Check all repair requests ({repairRequests.length})</p>
                    </div>
                  </div>
                </div>
                
                
                <div 
                  onClick={() => navigate('/new-technician')}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: '#36516C' }}>
                      <span className="text-white text-xl">👨‍💼</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg" style={{ color: '#000000' }}>Add Technician</h4>
                      <p className="text-sm" style={{ color: '#36516C' }}>Add new team member</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

           {/* Recent Activity Section */}
           <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-2xl font-bold" style={{ color: '#000000' }}>🕒 Recent Activity</h3>
               <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#072679' }}>
                 <span className="text-white text-lg">📈</span>
               </div>
             </div>
                            <div className="space-y-4">
                 {(() => {
                   // Generate recent activity from actual data
                   const activities = [];
                   
                   // Get recent requests (last 5)
                   const recentRequests = repairRequests
                     .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                     .slice(0, 5);
                   
                   recentRequests.forEach(request => {
                     const timeAgo = getTimeAgo(new Date(request.createdAt));
                     let icon, color, text;
                     
                     switch(request.status) {
                       case 'Ready for Pickup':
                         icon = '✅';
                         color = '#36516C';
                         text = `Repair #${request._id.slice(-6)} completed successfully`;
                         break;
                       case 'In Repair':
                       case 'Halfway Completed':
                         icon = '🔧';
                         color = '#42ADF5';
                         text = `Repair #${request._id.slice(-6)} in progress`;
                         break;
                       case 'Pending':
                         icon = '⏳';
                         color = '#D88717';
                         text = `New repair request for ${request.equipmentType?.replace('_', ' ')}`;
                         break;
                       default:
                         icon = '📋';
                         color = '#072679';
                         text = `Repair #${request._id.slice(-6)} status: ${request.status}`;
                     }
                     
                     activities.push({ icon, text, time: timeAgo, color });
                   });
                   
                   // If no recent requests, show default message
                   if (activities.length === 0) {
                     activities.push({
                       icon: '📋',
                       text: 'No recent activity',
                       time: 'Just now',
                       color: '#072679'
                     });
                   }
                   
                   return activities.map((activity, index) => (
                     <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
                       <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg" style={{ backgroundColor: activity.color }}>
                         {activity.icon}
                       </div>
                       <div className="flex-1">
                         <p className="font-medium" style={{ color: '#36516C' }}>{activity.text}</p>
                         <p className="text-sm" style={{ color: '#36516C' }}>{activity.time}</p>
                       </div>
                     </div>
                   ));
                 })()}
               </div>
           </div>
         </main>
      <Footer />
      </div>
    );
  };

export default Dashboard;
