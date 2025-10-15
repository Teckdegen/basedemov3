
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const About = () => {
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is Base Demo?",
      answer: "Base Demo is a risk-free trading simulator that lets you practice cryptocurrency trading on the Base blockchain using fake USDC. It's designed to help you learn trading strategies without risking real money."
    },
    {
      question: "How does the fake USDC work?",
      answer: "Every wallet profile starts with 1,500 fake USDC that you can use to buy and sell tokens. This simulates real trading but with virtual currency, so you can practice without financial risk."
    },
    {
      question: "Are the token prices real?",
      answer: "Yes! The token prices and market data are fetched from real sources like Dexscreener API, giving you an authentic trading experience with current market conditions."
    },
    {
      question: "What are AI Insights?",
      answer: "Our AI-powered system analyzes market trends, social sentiment, and your portfolio to provide personalized trading recommendations and insights to help improve your trading decisions."
    },
    {
      question: "Can I lose my fake USDC?",
      answer: "Yes, just like real trading, you can lose money through poor trading decisions. However, since it's all simulated, you can always reset your profile to start fresh with 1,500 fake USDC."
    },
    {
      question: "How do I switch between wallets?",
      answer: "Use the wallet switcher in the navigation bar to connect different wallet addresses. Each wallet maintains its own separate profile with independent balances and portfolios."
    },
    {
      question: "Is my data secure?",
      answer: "All your data is stored locally in your browser's localStorage. We don't collect or store any personal information on our servers, ensuring complete privacy."
    },
    {
      question: "Can I export my trading data?",
      answer: "Yes! You can export your portfolio data and trading history in CSV format from the P&L page. This helps you analyze your trading performance over time."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-32 pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-blue-600 mb-4">
            About Base Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learn cryptocurrency trading risk-free with our Base blockchain simulator. 
            Practice with real market data using fake USDC and AI-powered insights.
          </p>
        </motion.div>

        {/* Key Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6"
        >
          <Card className="backdrop-blur-md bg-white/80 border border-white/20 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Risk-Free Trading</h3>
              <p className="text-gray-600">
                Practice trading with 1,500 fake USDC without any financial risk. Perfect for beginners and experienced traders alike.
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/80 border border-white/20 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold text-2xl">AI</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">AI-Powered Insights</h3>
              <p className="text-gray-600">
                Get personalized trading recommendations and market analysis powered by advanced AI technology.
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/80 border border-white/20 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold text-xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Real Market Data</h3>
              <p className="text-gray-600">
                Trade with real-time prices and market data from Base blockchain tokens for an authentic experience.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="backdrop-blur-md bg-white/80 border border-white/20 shadow-xl">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Frequently Asked Questions
              </h2>
              
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      style={{ minHeight: '48px' }}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {faq.question}
                        </h3>
                        <ChevronDown 
                          className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                            openFAQ === index ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>
                    
                    <motion.div
                      initial={false}
                      animate={{
                        height: openFAQ === index ? 'auto' : 0,
                        opacity: openFAQ === index ? 1 : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-2">
                        <p className="text-gray-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <Card className="backdrop-blur-md bg-blue-50/80 border border-blue-200 shadow-xl">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-blue-800 mb-4">
                Ready to Start Trading?
              </h2>
              <p className="text-blue-600 mb-6 max-w-2xl mx-auto">
                Join thousands of users who are improving their trading skills with Base Demo. 
                Connect your wallet and start your risk-free trading journey today!
              </p>
              <Button
                onClick={() => navigate('/portfolio')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-xl"
                style={{ minHeight: '48px' }}
              >
                Start Trading Now
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <div className="backdrop-blur-md bg-white/15 rounded-xl px-6 py-4 inline-block border border-white/20">
            <p className="text-sm text-gray-600">
              <strong>Disclaimer:</strong> This is a demo trading application for educational purposes only. 
              No real money or cryptocurrency is involved. Past performance does not guarantee future results.
            </p>
            <div className="mt-3 flex items-center justify-center space-x-4 text-xs text-gray-500">
              <span>Powered by OpenAI</span>
              <span>•</span>
              <button className="hover:text-blue-600 transition-colors">Privacy Policy</button>
              <span>•</span>
              <button className="hover:text-blue-600 transition-colors">Terms of Service</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
