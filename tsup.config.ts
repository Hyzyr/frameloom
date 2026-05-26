import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'react/index': 'src/react/index.ts',
    'react/gsap': 'src/react/gsap.ts',
    'react/motion': 'src/react/motion.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  external: ['react', 'react-dom', 'gsap', 'framer-motion', 'motion/react', '@motionone/react'],
});