import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';

export default function AddProduct() {
    const [formData, setFormData] = useState({
        productId: '', name: '', description: '', category: '', brand: '',
        price: '', stock_quantity: '',
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [message, setMessage] = useState('');

    // Cricket categories and their corresponding brands
    const categories = {
        'Bat': ['SS', 'SG', 'MRF', 'Kookaburra', 'Gray-Nicolls', 'New Balance', 'Spartan', 'CA Plus'],
        'Ball': ['Kookaburra', 'SG', 'Dukes', 'Tasmania', 'Gray-Nicolls', 'CA Plus', 'Spartan', 'Red Cherry'],
        'Accessories': ['SG', 'MRF', 'Kookaburra', 'Gray-Nicolls', 'New Balance', 'Spartan', 'CA Plus', 'Masuri'],
        'Electronics': ['Sony', 'Canon', 'Nikon', 'GoPro', 'DJI', 'Panasonic', 'Samsung', 'Apple'],
        'Gaming': ['Sony', 'Microsoft', 'Nintendo', 'Steam', 'Oculus', 'HTC', 'Valve', 'Meta'],
        'Sports': ['Nike', 'Adidas', 'Puma', 'Under Armour', 'Reebok', 'New Balance', 'Asics', 'Mizuno'],
        'Wearables': ['Nike', 'Adidas', 'Puma', 'Under Armour', 'Reebok', 'New Balance', 'Asics', 'Mizuno', 'Kookaburra', 'SG', 'MRF', 'Gray-Nicolls', 'Spartan', 'CA Plus']
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            // Reset brand when category changes
            if (name === 'category') {
                newData.brand = '';
            }
            return newData;
        });
    };

    const onDrop = useCallback((acceptedFiles) => {
        console.log('Files dropped:', acceptedFiles);
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            console.log('Selected file:', file.name, file.size, file.type);
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            console.log('Image file set and preview created');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
        multiple: false,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        console.log('Form submission started');
        console.log('Image file:', imageFile);
        console.log('Form data:', formData);
        
        if (!imageFile) {
            setMessage({ type: 'error', text: 'Please select an image for the product.' });
            return;
        }

        const productData = new FormData();
        productData.append('image', imageFile);
        console.log('Image file appended to FormData:', imageFile.name, imageFile.size, imageFile.type);
        
        for (const key in formData) {
            productData.append(key, formData[key]);
            console.log(`Form field ${key}:`, formData[key]);
        }
        
        console.log('FormData contents:');
        for (let [key, value] of productData.entries()) {
            console.log(key, value);
        }
        
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            console.log('Sending request to backend...');
            
            const response = await axios.post('http://localhost:5000/api/products/', productData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            });

            console.log('Product created successfully:', response.data);
            setMessage({ type: 'success', text: 'Product added successfully!' });
            setFormData({ productId: '', name: '', description: '', category: '', brand: '', price: '', stock_quantity: '' });
            setImageFile(null);
            setImagePreview('');
        } catch (err) {
            console.error('Error adding product:', err);
            console.error('Error response:', err.response?.data);
            setMessage({ type: 'error', text: 'Error adding product: ' + (err.response?.data?.message || err.message) });
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg">
            <h1 className="text-3xl font-bold text-[#072679] mb-6">Add New Product</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Product Name*" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072679]" required />
                    <input type="text" name="productId" value={formData.productId} onChange={handleChange} placeholder="Product ID (Unique)*" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072679]" required />
                </div>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072679]" rows="4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Category*</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072679]" required>
                            <option value="">Choose a category...</option>
                            {Object.keys(categories).map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Brand*</label>
                        <select name="brand" value={formData.brand} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072679]" required disabled={!formData.category}>
                            <option value="">Choose a brand...</option>
                            {formData.category && categories[formData.category]?.map(brand => (
                                <option key={brand} value={brand}>{brand}</option>
                            ))}
                        </select>
                        {!formData.category && (
                            <p className="text-sm text-gray-500 mt-1">Please select a category first</p>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Price (LKR)*" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072679]" required min="0" step="0.01" />
                    <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} placeholder="Stock Quantity*" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072679]" required min="0" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Image*</label>
                    <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-[#072679] bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                        <input {...getInputProps()} />
                        <div className="space-y-2">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="text-sm text-gray-600">
                                {isDragActive ? "Drop the image here..." : "Drag & drop an image here, or click to select"}
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>
                        </div>
                    </div>
                    {imagePreview && (
                        <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                            <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-md border" />
                        </div>
                    )}
                </div>
                <button type="submit" className="w-full bg-[#072679] text-white px-6 py-3 rounded-lg hover:bg-[#051a5a] font-bold transition-colors">Add Product</button>
                {message.text && (
                    <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        <p className="font-medium">{message.text}</p>
                    </div>
                )}
            </form>
        </div>
    );
}
