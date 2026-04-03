import { CartProvider } from '../Stores/CartContext';
import Header from '../Common components/Header/Header';
import HeroBlock from '../Blocks/HeroBlock/HeroBlock';
import ProblemBlock from '../Blocks/ProblemBlock/ProblemBlock';
import CalculatorBlock from '../Blocks/CalculatorBlock/CalculatorBlock';
import ComparisonBlock from '../Blocks/ComparisonBlock/ComparisonBlock';
import HowToUseBlock from '../Blocks/HowToUseBlock/HowToUseBlock';
import ProductBlock from '../Blocks/ProductBlock/ProductBlock';
import BundlesBlock from '../Blocks/BundlesBlock/BundlesBlock';
import ReviewsBlock from '../Blocks/ReviewsBlock/ReviewsBlock';
import FaqBlock from '../Blocks/FaqBlock/FaqBlock';
import SafetyBlock from '../Blocks/SafetyBlock/SafetyBlock';
import TrustBlock from '../Blocks/TrustBlock/TrustBlock';
import CartModal from '../Common components/Cart/CartModal';
import StickyCartBar from '../Common components/StickyCartBar/StickyCartBar';
import CheckoutModal from '../Common components/Checkout/CheckoutModal';
import OrderResult from '../Common components/Checkout/OrderResult';
import CookieBanner from '../Common components/CookieBanner/CookieBanner';

function App() {
    return (
        <CartProvider>
            <Header />
            <main>
                <HeroBlock />
                <ProblemBlock />
                <CalculatorBlock />
                <ComparisonBlock />
                <HowToUseBlock />
                <ProductBlock />
                <BundlesBlock />
                <ReviewsBlock />
                <FaqBlock />
                <SafetyBlock />
            </main>
            <TrustBlock />
            <CartModal />
            <CheckoutModal />
            <OrderResult />
            <StickyCartBar />
            <CookieBanner />
        </CartProvider>
    );
}

export default App;
