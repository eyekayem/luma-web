import '../styles/globals.css'; // ✅ Correct path

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
