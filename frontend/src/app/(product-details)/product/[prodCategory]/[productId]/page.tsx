'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import DarkGridBackground from '@/components/Custom/backgrounds/DarkGridBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
} from "@/components/ui/drawer";
import { FaBolt } from 'react-icons/fa';
import TokenChecker from '@/tokenchecker';

const Page = () => {
    const params = useParams();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [imageOpen, setImageOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [orderOpen, setOrderOpen] = useState(false);
    const [orderError, setOrderError] = useState<null | String>(null);
    const [cartMessage, setCartMessage] = useState<null | String>(null);
    const router = useRouter();
    const [quantity, setQuantity] = useState(1);
    const [okCreateOrder, setokCreateOrder] = useState(true)

    const incrementQuantity = () => {
        if (quantity < product.stock) {
            setQuantity(prev => prev + 1);
        }
    };

    const decrementQuantity = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };


    const handelCart = async () => {
        await checkToken();
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("Authentication Error: No authentication token found.");
            }

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/v1/api/createCart`,
                { product_id: params.productId, quantity },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                }
            );
            if (response.data.message == "Item added to cart successfully") {
                setCartMessage(response.data.message)
            } else {
                setCartMessage(response.data.message)
            }
            console.log(response.data)
        } catch (error) {
            console.error('Error fetching product:', error);
        }
        setCartOpen(true);
    }

    const handelOrder = async () => {
        await checkToken();
        setOrderOpen(true);
    }

    const CreateMyOrder = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("Authentication Error: No authentication token found.");
            }

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/v1/api/createOrder`,
                { product_id: params.productId, quantity },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                }
            );
            if (response.data.message) {
                setOrderError(response.data.message)
            } else {
                setOrderOpen(false)
                setokCreateOrder(!okCreateOrder)
            }
            console.log(response.data)
        } catch (error) {
            console.error('Error fetching product:', error);
        }
    }


    const checkToken = async () => {
        const result = await TokenChecker();
        if (!result.success) {
            router.push('/login');
        }
        setLoading(false);
    };


    useEffect(() => {
        if (!params?.productId) return;

        const fetchProduct = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                if (!apiUrl) {
                    console.error("NEXT_PUBLIC_API_URL is not defined.");
                    return;
                }

                const response = await axios.post(
                    `${apiUrl}/v1/api/productOnlyId`,
                    { id: params.productId },
                    { headers: { 'Content-Type': 'application/json' } }
                );

                console.log(response.data.product)
                setProduct(response.data.product);
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [params?.productId, okCreateOrder]);

    if (loading) {
        return (
            <DarkGridBackground className="min-h-screen">
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-pulse space-y-8 w-full max-w-7xl mx-auto px-4">
                        <div className="h-[800px] bg-gray-700/20 rounded-lg" />
                    </div>
                </div>
            </DarkGridBackground>
        );
    }

    if (!product) {
        return (
            <DarkGridBackground className="min-h-screen">
                <div className="flex items-center justify-center h-screen">
                    <Card className="bg-black/50 text-white border-none p-8">
                        <h2 className="text-xl font-semibold">Product not found</h2>
                        <p className="mt-2">The requested product could not be found.</p>
                    </Card>
                </div>
            </DarkGridBackground>
        );
    }

    return (
        <DarkGridBackground className="min-h-screen ">
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Product Image Section */}
                        <div className="space-y-6 lg:sticky lg:top-4">
                            <div
                                className="w-full h-[500px] rounded-2xl overflow-hidden bg-black/30 backdrop-blur-sm cursor-pointer transform transition-transform hover:scale-[1.02]"
                                onClick={() => setImageOpen(true)}
                            >
                                <img
                                    src={product.product_url}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="text-white/70 text-sm text-center">
                                <p>Click image to view in full size</p>
                            </div>
                        </div>

                        {/* Product Details Section */}
                        <div className="space-y-8 ">
                            <div className="space-y-4">
                                <div className="">
                                    <div className="bg-[#FFA541] p-4 rounded-2xl flex justify-between mb-2">
                                        <div>
                                            <h1 className="text-4xl font-bold text-white mb-3">{product.name}</h1>
                                        </div>
                                        {product.isNew ?
                                            <div className='bg-green-500 cursor-pointer flex justify-between items-center text-white pl-4 pr-4 pt-2 pb-2 mb-3 rounded-2xl'>
                                                <div className='h-3 w-3 bg-white mr-3 rounded-3xl'></div>
                                                <div>New</div>
                                            </div>
                                            :
                                            <div className='bg-[#F20D25] flex justify-between items-center text-white pl-4 pr-4 pt-2 pb-2 mb-3 rounded-2xl'>
                                                <div className='h-3 w-3 bg-white mr-3 rounded-3xl'></div>
                                                <div>2-Hand</div>
                                            </div>
                                        }
                                    </div>

                                    <Card className="bg-white/5 border-none cursor-pointer  hover:bg-white/10">
                                        <CardContent className="p-6">
                                            {/* Product Description */}
                                            <h3
                                                className={`text-lg font-medium text-white mb-2 break-words whitespace-pre-wrap ${expanded ? "" : "line-clamp-3"
                                                    }`}
                                            >
                                                {product.description}
                                            </h3>

                                            {/* Read More / Read Less Button */}
                                            {product.description.split(" ").length > 30 && ( // Show button only if text is long
                                                <button
                                                    onClick={() => setExpanded(!expanded)}
                                                    className="text-blue-400 text-sm underline "
                                                >
                                                    {expanded ? "Read Less" : "Read More"}
                                                </button>
                                            )}

                                            {/* Product Details */}
                                            <div className="flex items-center gap-3 mt-4">
                                                <Badge variant="outline" className="text-sm px-3 py-1 bg-yellow-400">
                                                    {product.category}
                                                </Badge>
                                                <Badge variant="outline" className="text-sm px-3 py-1 bg-orange-400">
                                                    {product.type}
                                                </Badge>
                                            </div>
                                            <div>
                                                <Badge variant="outline" className="text-sm mt-6 p-3 py-1 bg-green-400">
                                                    {"in Stock " + product.stock}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <p className="text-3xl font-semibold text-white">
                                    ₹{" " + product.price.toFixed(2)}
                                </p>
                            </div>

                            <Separator className="bg-white/10" />



                            <div className="">
                                <Button className="h-14 text-lg bg-white text-black hover:bg-gray-100 transition-colors"
                                    onClick={handelCart}
                                >
                                    <ShoppingCart className="w-5 h-5 mr-2" />
                                    Add to cart
                                </Button>
                                <Button className="ml-3 h-14 text-lg bg-green-500 text-black hover:bg-gray-100 transition-colors"
                                    onClick={handelOrder}
                                >
                                    <FaBolt className="w-5 h-5 mr-2" />
                                    Buy Now
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Modal */}
            <Dialog open={imageOpen} onOpenChange={setImageOpen}>
                <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent">
                    <DialogTitle className="sr-only">
                        {product.name} - Full Size Image
                    </DialogTitle>
                    <div className="absolute right-4 top-4 z-50">
                        <div
                            className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center cursor-pointer"
                            onClick={() => setImageOpen(false)}
                            role="button"
                            aria-label="Close full size image"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    setImageOpen(false);
                                }
                            }}
                        >
                            <X className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div className="h-[90vh] w-full flex items-center justify-center">
                        <img
                            src={product?.product_url}
                            alt={`Full size view of ${product?.name}`}
                            className="max-h-full max-w-full object-contain"
                        />
                    </div>
                </DialogContent>
            </Dialog>
            <Drawer open={cartOpen} onOpenChange={setCartOpen}>
                <DrawerContent className="bg-black/90 border-none text-white">
                    <DrawerHeader>
                        <DrawerTitle className="text-2xl">Shopping Cart</DrawerTitle>
                        <DrawerDescription className="text-white/70">
                            Your selected items
                            <div className='font-semibold'>
                                {cartMessage == "Item added to cart successfully" ?
                                    <div className='text-green-700'>{cartMessage}</div> : <div className='text-rose-700'>{cartMessage}</div>
                                }
                            </div>
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="p-6 space-y-4">
                        <Card className="bg-white/5 border-none">
                            <CardContent className="p-4 flex items-center gap-4">
                                <img
                                    src={product?.product_url}
                                    alt={product?.name}
                                    className="w-20 h-20 object-cover rounded-lg"
                                />
                                <div>
                                    <h3 className="text-lg font-semibold">{product?.name}</h3>
                                    <p className="text-white/70">₹ {product?.price.toFixed(2)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <DrawerFooter className="flex-row gap-3 justify-end px-6 pb-6">
                        <Button
                            variant="outline"
                            onClick={() => setCartOpen(false)}
                            className="border-white/20"
                        >
                            Continue Shopping
                        </Button>
                        <Button className="bg-green-500 hover:bg-green-600">
                            Checkout Now
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {/* Order Drawer */}
            <Drawer open={orderOpen} onOpenChange={setOrderOpen}>
                <DrawerContent className="bg-black/90 border-none text-white">
                    <DrawerHeader>
                        <DrawerTitle className="text-2xl">Confirm Order</DrawerTitle>
                        <DrawerDescription className="text-white/70">
                            Review your purchase
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-white/70">Product:</span>
                                <span>{product?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/70">Price per item:</span>
                                <span>₹ {product?.price.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/70">Quantity:</span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={decrementQuantity}
                                        disabled={quantity <= 1}
                                        className="h-8 w-8 text-white border-white/30 hover:bg-white/10"
                                    >
                                        -
                                    </Button>
                                    <span className="px-4">{quantity}</span>
                                    <Button
                                        variant="outline"
                                        onClick={incrementQuantity}
                                        disabled={quantity >= product.stock}
                                        className="h-8 w-8 text-white border-white/30 hover:bg-white/10"
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-white/20" />

                        <div className="flex justify-between text-lg font-semibold">
                            <span>Total:</span>
                            <span>₹ {(product?.price * quantity).toFixed(2)}</span>
                        </div>
                    </div>
                    <DrawerFooter className="flex-row gap-3 justify-end px-6 pb-6">
                        <div>
                            <div>
                                {
                                    orderError ? <div className='mb-4 bg-red-600 p-4'>
                                        {orderError}
                                    </div> : null
                                }
                            </div>
                            <div>
                                <Button
                                    variant="outline"
                                    onClick={() => setOrderOpen(false)}
                                    className="border-white/20 bg-rose-800 hover:bg-white hover:text-black"
                                >
                                    Cancel
                                </Button>
                                <Button className="bg-green-500 hover:bg-green-600"
                                    onClick={CreateMyOrder}
                                >
                                    Confirm Purchase
                                </Button>
                            </div>
                        </div>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </DarkGridBackground>
    );
};

export default Page;