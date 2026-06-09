import React from 'react';
import { motion } from 'framer-motion';
import { 
  FilePlus, 
  Users, 
  MessageCircle, 
  TrendingUp, 
  ChevronRight 
} from 'lucide-react';

const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section" style={{ 
        background: 'var(--header-gradient)', 
        color: 'white', 
        padding: '6rem 2rem', 
        textAlign: 'center',
        paddingBottom: '8rem'
      }}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', fontWeight: 800 }}>
            Welcome to DevCollab 🚀
          </h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2.5rem', opacity: 0.9, maxWidth: '700px', margin: '0 auto 2.5rem' }}>
            A collaborative platform where developers connect, share projects, and build together.
          </p>
          <button className="btn-white">
            Get Started
          </button>
        </motion.div>
      </section>

      {/* What You Can Do Section */}
      <section className="section" style={{ marginTop: '-4rem' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>☀️ What You Can Do</h2>
          </div>

          <motion.div 
            className="features-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1.5rem' 
            }}
          >
            {[
              { 
                title: 'Create Projects', 
                desc: 'Start your own project, define goals, and invite team members.',
                icon: <FilePlus size={40} color="#7c3aed" />
              },
              { 
                title: 'Join Projects', 
                desc: 'Explore published projects and collaborate with other developers.',
                icon: <Users size={40} color="#3b82f6" />
              },
              { 
                title: 'Team Chat', 
                desc: 'Communicate instantly with your team through real-time chat.',
                icon: <MessageCircle size={40} color="#ec4899" />
              },
              { 
                title: 'Grow Together', 
                desc: 'Build, learn, and grow with your team in one organized workspace.',
                icon: <TrendingUp size={40} color="#22c55e" />
              }
            ].map((feature, i) => (
              <motion.div key={i} className="card" variants={itemVariants} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                  {feature.icon}
                </div>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>{feature.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section" style={{ background: 'var(--surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>👾 How It Works</h2>
          </div>

          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {[
              "Sign Up / Log In to your account.",
              "Publish a Project if you want to create something new.",
              "Join a Project to collaborate with others.",
              "Chat & Collaborate with your team directly inside DevCollab.",
              "Grow Together by building, learning, and contributing."
            ].map((step, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1.5rem', 
                  marginBottom: '1rem', 
                  background: 'var(--background)',
                  padding: '1.25rem 2rem',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  background: 'var(--secondary)', 
                  color: 'white', 
                  borderRadius: '6px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  flexShrink: 0
                }}>{i + 1}</div>
                <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-main)' }}>{step}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer / CTA Section */}
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Ready to build something amazing? ✨</h2>
          <button className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
            Get Started Now
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;
