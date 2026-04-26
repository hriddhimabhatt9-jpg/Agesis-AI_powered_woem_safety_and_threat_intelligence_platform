import { motion } from 'framer-motion';

export default function PageWrapper({ children, title, subtitle, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`page-container pt-20 lg:pt-24 pb-24 lg:pb-8 min-h-screen ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-8">
          {title && <h1 className="section-title">{title}</h1>}
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
      )}
      {children}
    </motion.div>
  );
}
