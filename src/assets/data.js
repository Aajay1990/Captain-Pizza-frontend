import img_sv1 from './MERGHERITA.png';
import img_sv2 from './ONION& JALAPENO.png';
import img_sv3 from './SWEET CORN.png';
import img_sv4 from './Paneer & Onion.png';
import img_sv5 from './TOMATO & CAPSICUM.png';
import img_sv6 from './2 IN 1 PIZZA.png';
import img_cv1 from './MIX MASTI VEG.png';
import img_cv2 from './GOLDEN LOVER .png';
import img_cv3 from './MAXICAN SPECIAL.png';
import img_cv4 from './SPICY VEG.png';
import img_cv5 from './GOLDEN CORN VEG.png';
import img_cv6 from './FARM HOUSE.png';
import img_cv7 from './SPL. DOUBLE CHEES MARGERITA.png';
import img_dv1 from './SPL. MAKHANI PANEER.png';
import img_dv2 from './SPL. PUNJABI PANEER MASTI.png';
import img_dv3 from './SPL. DELUXE VEG.png';
import img_dv4 from './SPL. SPICY PEPPY PANEER.png';
import img_dv5 from './SPL. DELUXE VEG.png';
import img_dv6 from './GOLDEN PARADISE.png';
import img_su1 from './EXTRAVAGANZA VEG.png';
import img_su2 from './SPICY WONDER.png';
import img_su3 from './MAXICAN SPECIAL2.png';
import img_su4 from "./CHEF'S VEG SPECIAL PIZZA.png";
import img_su5 from './SPL. SUPREME VEG.png';
import img_b1 from './VEG TIKKI BURGER.png';
import img_b2 from './CHEESY BURGER.png';
import img_b3 from './CRISPY VEG.png';
import img_b4 from './CLASSIC VEG.png';
import img_b5 from './MONSTER CLUB.png';
import img_w1 from './VEG TIKKI WRAP.png';
import img_w2 from './CRISPY VEG WRAP.png';
import img_w3 from './CLASSIC VEG WRAP.png';
import img_w4 from './PANEER WRAP.png';
import img_w5 from './MONSTER CLUB WRAP.png';
import img_s1 from './VEG. GRILL SANDWICH.png';
import img_s2 from './CHEESE GRILL SANDWICH.png';
import img_sd1 from './CHEESY GARLIC BREAD.png';
import img_sd2 from './SPICY STUFFED GARLIC BREAD.png';
import img_sd3 from './FRENCH FRIES.png';
import img_sd4 from './PERI PERI FRIES.png';
import img_sd5 from './RED SAUCE PASTA.png';
import img_sd6 from './WHITE SAUCE PASTA.png';
import img_sd7 from './CHILLY SAUCE PASTA.png';
import img_sd8 from './MAKHANI SAUCE PASTA.png';
import img_sd9 from './TANDOORI SAUCE PASTA.png';
import img_bv1 from './VANILA SHAKE.png';
import img_bv2 from './STRAWBERRY SHAKE.png';
import img_bv3 from './COLD COFFEE.png';
import img_bv4 from './CHOCOLATE SHAKE.png';
import img_bv5 from './BUTTER SCOTCH SHAKE .png';
import img_bv6 from './OREO SHAKE.png';
import img_bv7 from './MINT MOJITO.png';
import img_bv8 from './BLUE OCEAN.png';
import img_bv9 from './MASALA SODA.png';
import img_bv10 from './GREEN APPLE.png';
import img_bv11 from './WATERMELON .png';
import img_bv12 from './LEAMON ICE TEA.png';
import img_sd11 from './CHEESE MAGGI.png';

import offerImg1 from './Buy 1 Get 1 FREE.png';
import offerImg2 from './Super Value Friends Meal.png';
import offerImg3 from './Family Combo.png';

export const menuData = {
    pizzas: [
        {
            category: "Simple Veg",
            id: 'simple-veg',
            items: [
                { id: "sv1", name: "Margherita", desc: "Pizza sauce & cheese", image: img_sv1, price: { small: 110, medium: 210, large: 340 } },
                { id: "sv2", name: "Onion & Jalapeno", desc: "Pizza sauce, jalapeno & cheese", image: img_sv2, price: { small: 110, medium: 210, large: 340 } },
                { id: "sv3", name: "Sweet Corn", desc: "Pizza sauce, sweet corn & cheese", image: img_sv3, price: { small: 110, medium: 210, large: 340 } },
                { id: "sv4", name: "Paneer & Onion", desc: "Paneer, Onion & cheese", image: img_sv4, price: { small: 110, medium: 210, large: 340 } },
                { id: "sv5", name: "Tomato & Capsicum", desc: "Capsicum, Tomato & cheese", image: img_sv5, price: { small: 110, medium: 210, large: 340 } },
                { id: "sv6", name: "2 In 1 Veg. Pizza", desc: "Pizza sauce, Onion, Tomato & cheese", image: img_sv6, price: { small: 110, medium: 210, large: 340 } },
            ]
        },
        {
            category: "Classic Veg",
            id: 'classic-veg',
            items: [
                { id: "cv1", name: "Mix Masti Veg", desc: "Onion, Jalapeno, Tomato & cheese", image: img_cv1, price: { small: 140, medium: 280, large: 410 } },
                { id: "cv2", name: "Golden Lover", desc: "Onion, Capsicum, Mushroom & cheese", image: img_cv2, price: { small: 140, medium: 280, large: 410 } },
                { id: "cv3", name: "Mexican Special", desc: "Onion, Capsicum, Tomato & cheese", image: img_cv3, price: { small: 140, medium: 280, large: 410 } },
                { id: "cv4", name: "Spicy Veg", desc: "Onion, Capsicum, Green chillies & cheese", image: img_cv4, price: { small: 140, medium: 280, large: 410 } },
                { id: "cv5", name: "Golden Corn Veg", desc: "Corn, Capsicum, Tomato & cheese", image: img_cv5, price: { small: 140, medium: 280, large: 410 } },
                { id: "cv6", name: "Farm House", desc: "Onion, Capsicum, Tomato, Mushroom & cheese", image: img_cv6, price: { small: 140, medium: 280, large: 410 } },
                { id: "cv7", name: "Spl. Double Chees Margerita", desc: "Pizza sauce & Double cheese", image: img_cv7, price: { small: 140, medium: 280, large: 410 } },
            ]
        },
        {
            category: "Deluxe Veg",
            id: 'deluxe-veg',
            items: [
                { id: "dv1", name: "Spl. Makhani Paneer", desc: "Makhani sauce, Onion, Paneer & Cheese", image: img_dv1, price: { small: 180, medium: 360, large: 520 } },
                { id: "dv2", name: "Spl. Punjabi Paneer Masti", desc: "Onion, Capsicum, Red Chilli Peppers, Paneer & cheese", image: img_dv2, price: { small: 180, medium: 360, large: 520 } },
                { id: "dv3", name: "Spl. Deluxe Mix Paneer", desc: "Tandoori Sauce, Paneer, Capsicum, Red Chilli Peppers, Onion & cheese", image: img_dv3, price: { small: 180, medium: 360, large: 520 } },
                { id: "dv4", name: "Spl. Spicy Peppy Paneer", desc: "Spicy Sauce, Onion, Capsicum, Paneer, Red Chili Peppers & cheese", image: img_dv4, price: { small: 180, medium: 360, large: 520 } },
                { id: "dv5", name: "Spl. Deluxe Veg", desc: "Onion, Capsicum, Mushroom, Paneer, Corn & cheese", image: img_dv5, price: { small: 180, medium: 360, large: 520 } },
                { id: "dv6", name: "Golden Paradise", desc: "Corn, Jalapeno, Red Chilli Peppers & Cheese", image: img_dv6, price: { small: 180, medium: 360, large: 520 } },
            ]
        },
        {
            category: "Supreme Veg",
            id: 'supreme-veg',
            items: [
                { id: "su1", name: "Extravaganza Veg", desc: "Onion, Capsicum, Jalapeno, Mushroom, Black Olive", image: img_su1, price: { small: 230, medium: 420, large: 580 } },
                { id: "su2", name: "Spicy Wonder", desc: "Onion, Capsicum, Mushroom & cheese", image: img_su2, price: { small: 230, medium: 420, large: 580 } },
                { id: "su3", name: "Mexican Special", desc: "Onion, Capsicum, Red Paprika, Green Chilli Tomato & cheese", image: img_su3, price: { small: 230, medium: 420, large: 580 } },
                { id: "su4", name: "Chef's Veg Special Pizza", desc: "Red Paprika, Capsicum, Mushroom, Jalapeno, paneer & Golden Corns Green chillies & cheese", image: img_su4, price: { small: 230, medium: 420, large: 580 } },
                { id: "su5", name: "Spl. Supreme Veg", desc: "Onion, Capsicum, Tomato, Mushroom, Jalapeno, Sweet Corn & cheese", image: img_su5, price: { small: 230, medium: 420, large: 580 } },
            ]
        }
    ],
    burgers: [
        { id: "b1", name: "Veg Tikki Burger", price: 40, image: img_b1 },
        { id: "b2", name: "Cheesy Burger", price: 50, image: img_b2 },
        { id: "b3", name: "Crispy Veg Burger", price: 70, image: img_b3 },
        { id: "b4", name: "Classic Veg Burger", price: 100, image: img_b4 },
        { id: "b5", name: "Monster Club Burger", price: 130, image: img_b5 },
    ],
    wraps: [
        { id: "w1", name: "Veg Tikki Wrap", price: 50, image: img_w1 },
        { id: "w2", name: "Crispy Veg Wrap", price: 80, image: img_w2 },
        { id: "w3", name: "Classic Veg Wrap", price: 110, image: img_w3 },
        { id: "w4", name: "Paneer Wrap", price: 120, image: img_w4 },
        { id: "w5", name: "Monster Club Wrap", price: 130, image: img_w5 },
    ],
    sandwiches: [
        { id: "s1", name: "Veg. Grill Sandwich", price: 65, image: img_s1 },
        { id: "s2", name: "Cheese Grill Sandwich", price: 75, image: img_s2 },
    ],
    sides: [
        { id: "sd1", name: "Cheesy Garlic Bread", price: 100, image: img_sd1 },
        { id: "sd2", name: "Spicy Stuffed Garlic Bread", price: 130, image: img_sd2 },
        { id: "sd3", name: "French Fries", price: 70, image: img_sd3 },
        { id: "sd4", name: "Peri Peri Fries", price: 90, image: img_sd4 },
        { id: "sd5", name: "Red Sauce Pasta", price: 90, image: img_sd5 },
        { id: "sd6", name: "White Sauce Pasta", price: 100, image: img_sd6 },
        { id: "sd7", name: "Chilly Sauce Pasta", price: 100, image: img_sd7 },
        { id: "sd8", name: "Makhani Sauce Pasta", price: 110, image: img_sd8 },
        { id: "sd9", name: "Tandoori Sauce Pasta", price: 110, image: img_sd9 },
        { id: "sd10", name: "Veg Maggi", price: 50, image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&q=80&w=400" },
        { id: "sd11", name: "Cheese Maggi", price: 70, image: img_sd11 },
        { id: "sd12", name: "Chocolava", price: 50, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400" },
    ],
    beverages: [
        { id: "bv1", name: "Vanilla Shake", price: 65, image: img_bv1 },
        { id: "bv2", name: "Strawberry Shake", price: 70, image: img_bv2 },
        { id: "bv3", name: "Cold Coffee", price: 70, image: img_bv3 },
        { id: "bv4", name: "Chocolate Shake", price: 75, image: img_bv4 },
        { id: "bv5", name: "Butter Scotch Shake", price: 80, image: img_bv5 },
        { id: "bv6", name: "Oreo Shake", price: 100, image: img_bv6 },
        { id: "bv7", name: "Mint Mojito", price: 60, image: img_bv7 },
        { id: "bv8", name: "Blue Ocean", price: 65, image: img_bv8 },
        { id: "bv9", name: "Masala Soda", price: 65, image: img_bv9 },
        { id: "bv10", name: "Green Apple", price: 70, image: img_bv10 },
        { id: "bv11", name: "Watermelon", price: 75, image: img_bv11 },
        { id: "bv12", name: "Lemon Ice Tea", price: 75, image: img_bv12 },
    ],
    specialOffers: [
        { id: "cm1", name: "Buy 1 Get 1 FREE", desc: "Choose 1 from Deluxe Veg (Med/Large) & Get 1 from Supreme Veg (Med/Large) Free!", price: 340, image: offerImg1 },
        { id: "cm2", name: "Super Value Friends Meal", desc: "1 Aloo Tikki Burger + Small French Fries + Coke (250ml)", price: 100, image: offerImg2 },
        { id: "cm3", name: "Family Combo", desc: "1 Medium Pizza + 2 Burgers + Coke (250ml)", price: 340, image: offerImg3 },
    ]
}
