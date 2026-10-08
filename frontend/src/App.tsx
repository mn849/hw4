import { type FormEvent, useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation, useParams } from "react-router-dom";
import { fetchChatHistory, fetchProduct, fetchProducts, getStoredUser, imageUrl, loginAccount, parseColors, registerAccount, sendChatMessage, type PageContext, type Product, type ProductCard as ChatProduct, type User } from "./api";

function Header() {
  return (
    <header className="site-header">
      <Link to="/" className="brand" aria-label="Campus Customs home">
        <span className="brand-mark">CC</span>
        <span>Campus Customs</span>
      </Link>
      <nav className="main-nav" aria-label="Main navigation">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/products">Products</NavLink>
        <NavLink to="/about">About Us</NavLink>
        <NavLink to="/login">Log in</NavLink>
        <NavLink to="/create-account" className="nav-cta">Create account</NavLink>
      </nav>
    </header>
  );
}

function BulldogChat({ pageContext }: { pageContext?: PageContext }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [user] = useState<User | null>(() => getStoredUser());
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; text: string; products?: ChatProduct[]; suggestions?: string[] }>>([{ role: "assistant", text: "Hi! I’m your Campus Customs guide. How can I help?", suggestions: ["Show me hoodies", "Browse products"] }]);
  const [busy, setBusy] = useState(false);
  const location = useLocation();
  useEffect(() => {
    if (!user) return;
    fetchChatHistory(user.id).then((history) => {
      if (history.length) setMessages(history.map((item) => ({ role: item.role, text: item.content, products: item.products })));
    }).catch(() => undefined);
  }, [user]);
  const sendMessageText = async (trimmed: string) => {
    if (!trimmed || busy) return;
    setMessages((current) => [...current, { role: "user", text: trimmed }]); setMessage(""); setBusy(true);
    try { const result = await sendChatMessage(trimmed, user?.id, { ...pageContext, path: location.pathname }); setMessages((current) => [...current, { role: "assistant", text: result.reply, products: result.products, suggestions: result.suggestions }]); }
    catch { setMessages((current) => [...current, { role: "assistant", text: "I can’t reach the shop assistant right now. Please try again." }]); }
    finally { setBusy(false); }
  };
  const send = (event: FormEvent) => { event.preventDefault(); void sendMessageText(message.trim()); };
  return <div className="chat-dock"><button className="bulldog-chat" type="button" aria-label="Open Campus Customs chat" aria-expanded={open} onClick={() => setOpen(!open)}><span className="bulldog-face" aria-hidden="true">🐶</span><span className="phone" aria-hidden="true">☎</span><span className="chat-label">{open ? "Close" : "Chat"}</span></button>{open && <div className="chat-panel"><div className="chat-panel-head"><strong>Campus Customs guide</strong><span>{user ? `Remembering ${user.first_name || user.name}` : "Guest chat · history not saved"}</span></div><div className="chat-messages">{messages.map((item, index) => <div className="chat-message-group" key={`${item.role}-${index}`}><p className={`chat-message ${item.role}`}>{item.text}</p>{item.products?.map((product) => <ChatProductCard key={product.product_id} product={product} />)}{item.role === "assistant" && item.suggestions && <div className="chat-suggestions">{item.suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => void sendMessageText(suggestion)}>{suggestion} ↗</button>)}</div>}</div>)}</div><form className="chat-form" onSubmit={send}><input aria-label="Chat message" placeholder="Ask about the collection…" value={message} onChange={(event) => setMessage(event.target.value)} /><button type="submit" disabled={busy}>{busy ? "…" : "↑"}</button></form></div>}</div>;
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link className="product-card" to={`/products/${product.product_id}`}>
      <div className="product-image-wrap">
        <img src={imageUrl(product.image_file_path)} alt={product.name} />
      </div>
      <div className="product-card-copy">
        <p className="eyebrow">{product.garment_type}</p>
        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <strong>${product.price.toFixed(2)}</strong>
      </div>
    </Link>
  );
}

function ChatProductCard({ product }: { product: ChatProduct }) {
  return <Link className="chat-product-card" to={`/products/${product.product_id}`}><img src={imageUrl(product.image_file_path)} alt={product.name} /><span><strong>{product.name}</strong><small>{product.short_description}</small><b>${product.price.toFixed(2)} ↗</b></span></Link>;
}

type PowerColor = "pink" | "blue" | "green";

function PowerpuffGraphic({ color, small = false }: { color: PowerColor; small?: boolean }) {
  return <svg className={`powerpuff-graphic ${color} ${small ? "small" : ""}`} viewBox="0 0 120 120" role="img" aria-label={`${color} campus hero`}><path className="hero-hair" d="M25 51C13 35 19 10 38 16c8-13 36-13 44 0 19-6 25 19 13 35l-8 11H33Z" /><circle className="hero-head" cx="60" cy="57" r="36" /><path className="hero-fringe" d="M27 47c4-21 18-29 33-29 16 0 29 9 33 29-14-9-22-12-33-12-12 0-21 4-33 12Z" /><ellipse className="hero-eye" cx="45" cy="59" rx="10" ry="14" /><ellipse className="hero-eye" cx="75" cy="59" rx="10" ry="14" /><circle className="hero-pupil" cx="47" cy="62" r="4" /><circle className="hero-pupil" cx="73" cy="62" r="4" /><path className="hero-mouth" d="M54 77c4 4 8 4 12 0" /><path className="hero-body" d="M39 91c7-7 35-7 42 0l8 20H31Z" /><path className="hero-cape" d="M39 92 20 111l22-7M81 92l19 19-22-7" /></svg>;
}

type BattleHero = { name: string; color: "pink" | "blue" | "green"; power: string; symbol: string };
const battleHeroes: BattleHero[] = [
  { name: "Blossom", color: "pink", power: "Heart Beam", symbol: "✦" },
  { name: "Bubbles", color: "blue", power: "Bubble Burst", symbol: "○" },
  { name: "Buttercup", color: "green", power: "Power Punch", symbol: "★" },
];

function PowerpuffBattle() {
  const [hero, setHero] = useState(0);
  const [enemy, setEnemy] = useState(1);
  const [playerHP, setPlayerHP] = useState(100);
  const [enemyHP, setEnemyHP] = useState(100);
  const [log, setLog] = useState("Choose your hero and make the first move.");
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const chosen = battleHeroes[hero];
  const opponent = battleHeroes[enemy];
  const reset = (selectedHero = hero) => { setEnemy((selectedHero + 1) % battleHeroes.length); setPlayerHP(100); setEnemyHP(100); setLog("Choose an attack to protect the campus collection."); setWon(false); setLost(false); };
  const attack = (label: string, damage: number) => {
    if (won || lost) return;
    const nextEnemyHP = Math.max(0, enemyHP - damage);
    if (nextEnemyHP === 0) { setEnemyHP(0); setWon(true); setLog(`${chosen.name}'s ${label} wins the battle! Your merch reward is ready.`); return; }
    const counter = 8 + Math.floor(Math.random() * 9);
    const nextPlayerHP = Math.max(0, playerHP - counter);
    setEnemyHP(nextEnemyHP); setPlayerHP(nextPlayerHP);
    if (nextPlayerHP === 0) { setLost(true); setLog(`${opponent.name} got the upper hand. Reset and try another attack.`); }
    else setLog(`${chosen.name} used ${label}. ${opponent.name} countered for ${counter} damage.`);
  };
  return <section className="battle-section"><div className="battle-heading"><div><p className="eyebrow">Campus Customs mini-game</p><h2>Power up your campus crew.</h2><p>Choose a hero, win a friendly battle, and unlock a merch reward.</p></div><span className="battle-badge">WIN = 10% OFF</span></div><div className="hero-picker">{battleHeroes.map((item, index) => <button type="button" className={`battle-hero ${item.color} ${hero === index ? "selected" : ""}`} key={item.name} onClick={() => { setHero(index); reset(index); }}><span className="hero-orb"><PowerpuffGraphic color={item.color} small /></span><strong>{item.name}</strong><small>{item.power}</small></button>)}</div><div className="battle-arena"><div className="battle-fighter"><span className={`fighter-face ${chosen.color}`}><PowerpuffGraphic color={chosen.color} /></span><strong>{chosen.name}</strong><div className="health"><span style={{ width: `${playerHP}%` }} /></div><small>{playerHP} HP</small></div><div className="versus">VS</div><div className="battle-fighter"><span className={`fighter-face ${opponent.color}`}><PowerpuffGraphic color={opponent.color} /></span><strong>{opponent.name}</strong><div className="health enemy"><span style={{ width: `${enemyHP}%` }} /></div><small>{enemyHP} HP</small></div></div><p className="battle-log" aria-live="polite">{log}</p>{won && <div className="discount-reward"><strong>You saved the day!</strong><span>Use code <b>CAMPUS-POWER-10</b> for 10% off your merch reward.</span></div>}{!won && <div className="attack-controls"><button type="button" onClick={() => attack(chosen.power, 22)}>⚡ {chosen.power}</button><button type="button" onClick={() => attack("Teamwork", 16)}>✦ Teamwork</button><button type="button" onClick={() => attack("Super Blast", 30)}>★ Super Blast</button></div>}{(won || lost) && <button className="button battle-reset" type="button" onClick={() => reset()}>Play again</button>}</section>;
}

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  useEffect(() => { fetchProducts().then(setProducts).catch((err: Error) => setError(err.message)).finally(() => setLoading(false)); }, []);
  const categories = ["All", ...Array.from(new Set(products.map((product) => product.garment_type))).sort()];
  const filteredProducts = products.filter((product) => {
    const matchesCategory = category === "All" || product.garment_type === category;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${product.name} ${product.description} ${product.garment_type} ${product.search_tags}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
  return (
    <PageShell>
      <section className="page-intro">
        <p className="eyebrow">The Campus Customs collection</p>
        <h1>Wear your Yale story.</h1>
        <p>Find familiar favorites, college gear, and gifts made for the people who make campus feel like home.</p>
      </section>
      <section className="catalogue-controls" aria-label="Catalogue filters"><label className="catalogue-search">Search the collection<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try hoodie, college, or sports…" /></label><div className="category-filters" aria-label="Filter by category">{categories.slice(0, 9).map((item) => <button className={category === item ? "filter-chip active" : "filter-chip"} key={item} type="button" onClick={() => setCategory(item)}>{item}</button>)}</div></section>
      {loading && <p className="notice loading-state">Loading the collection…</p>}
      {error && <div className="notice error"><strong>We couldn’t load the collection.</strong><span>{error} Start the FastAPI server at port 8000, then try again.</span><button className="text-button" type="button" onClick={() => window.location.reload()}>Retry</button></div>}
      {!loading && !error && <p className="results-count">{filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} showing</p>}
      {!loading && !error && filteredProducts.length > 0 && <section className="product-grid" aria-label="Campus Customs products">{filteredProducts.map((product) => <ProductCard key={product.product_id} product={product} />)}</section>}
      {!loading && !error && filteredProducts.length === 0 && <div className="empty-state"><h2>No products found.</h2><p>Try a broader search or clear the filters to see the full collection.</p><button className="button primary" type="button" onClick={() => { setSearch(""); setCategory("All"); }}>Clear filters</button></div>}
    </PageShell>
  );
}

function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  useEffect(() => { fetchProducts().then((items) => setFeatured(items.slice(0, 4))).catch(() => undefined); }, []);
  return (
    <PageShell>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">From campus, for campus</p>
          <h1>Find something worth remembering.</h1>
          <p>Curated Yale apparel and gifts for late-night study sessions, first games, and every story in between.</p>
          <Link className="button primary" to="/products">Shop the collection <span>↗</span></Link>
        </div>
        <div className="hero-art" aria-label="Yale-inspired campus hero artwork"><span className="hero-stamp">YALE<br /><small>CAMPUS CREW</small></span><div className="hero-characters"><PowerpuffGraphic color="pink" /><PowerpuffGraphic color="blue" /><PowerpuffGraphic color="green" /></div></div>
      </section>
      <section className="section-heading"><div><p className="eyebrow">A few favorites</p><h2>Made for your next chapter.</h2></div><Link to="/products" className="text-link">View all products ↗</Link></section>
      <section className="product-grid compact">{featured.map((product) => <ProductCard key={product.product_id} product={product} />)}</section>
      <PowerpuffBattle />
    </PageShell>
  );
}

function ProductDetailPage() {
  const { productId = "" } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { fetchProduct(productId).then(setProduct).catch((err: Error) => setError(err.message)); }, [productId]);
  if (error) return <PageShell><p className="notice error">{error}</p><Link className="text-link" to="/products">← Back to products</Link></PageShell>;
  if (!product) return <PageShell><p className="loading">Loading product…</p></PageShell>;
  const colors = parseColors(product.colors);
  return (
    <PageShell pageContext={{ product_id: product.product_id, product_name: product.name, description: product.description, price: product.price, colors }}>
      <Link className="back-link" to="/products">← Back to products</Link>
      <section className="detail-layout">
        <div className="detail-image"><img src={imageUrl(product.image_file_path)} alt={product.name} /></div>
        <div className="detail-copy">
          <p className="eyebrow">{product.garment_type}</p>
          <h1>{product.name}</h1>
          <p className="detail-price">${product.price.toFixed(2)}</p>
          <p className="detail-description">{product.description}</p>
          <div className="detail-meta"><div><span className="meta-label">Colors</span><p>{colors.join(" · ") || "See product image"}</p></div><div><span className="meta-label">Sizes & availability</span><div className="size-list">{product.inventory.map((item) => <span className={item.quantity === 0 ? "size out" : "size"} key={item.size}>{item.size}: {item.quantity === 0 ? "Out" : item.quantity}</span>)}</div></div></div>
          <button className="button primary" type="button">Add to wishlist <span>♡</span></button>
        </div>
      </section>
    </PageShell>
  );
}

function SimplePage({ title, text }: { title: string; text: string }) {
  return <PageShell><section className="page-intro narrow"><p className="eyebrow">Campus Customs</p><h1>{title}</h1><p>{text}</p></section></PageShell>;
}

function AuthShell({ children, eyebrow, title, subtitle }: { children: React.ReactNode; eyebrow: string; title: string; subtitle: string }) {
  return <PageShell><section className="auth-layout"><div className="auth-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{subtitle}</p></div><div className="auth-card">{children}</div></section></PageShell>;
}

function CreateAccountPage() {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "", confirmation: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setSuccess("");
    if (form.password !== form.confirmation) { setError("Passwords must match."); return; }
    setBusy(true);
    try { const result = await registerAccount({ first_name: form.first_name, last_name: form.last_name, email: form.email, password: form.password }); setSuccess(`${result.message} You can now log in.`); setForm({ first_name: "", last_name: "", email: "", password: "", confirmation: "" }); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not create account."); }
    finally { setBusy(false); }
  };
  return <AuthShell eyebrow="Join the collection" title="Make it yours." subtitle="Create an account to keep your Campus Customs favorites close."><form className="auth-form" onSubmit={submit}><div className="form-row"><label>First name<input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></label><label>Last name<input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></label></div><label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Password<input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label><label>Confirm password<input required type="password" value={form.confirmation} onChange={(e) => setForm({ ...form, confirmation: e.target.value })} /></label>{error && <p className="form-message error">{error}</p>}{success && <p className="form-message success">{success}</p>}<button className="button primary form-submit" disabled={busy} type="submit">{busy ? "Creating…" : "Create account"} <span>↗</span></button><p className="form-footnote">Already have an account? <Link to="/login">Log in</Link></p></form></AuthShell>;
}

function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setSuccess(""); setBusy(true);
    try { const result = await loginAccount(form); localStorage.setItem("campus_customs_user", JSON.stringify(result.user)); setSuccess(`Welcome back, ${result.user.first_name || result.user.name}.`); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not log in."); }
    finally { setBusy(false); }
  };
  return <AuthShell eyebrow="Welcome back" title="Pick up where you left off." subtitle="Log in to keep your favorites and campus stories together."><form className="auth-form" onSubmit={submit}><label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Password<input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>{error && <p className="form-message error">{error}</p>}{success && <p className="form-message success">{success}</p>}<button className="button primary form-submit" disabled={busy} type="submit">{busy ? "Logging in…" : "Log in"} <span>↗</span></button><p className="form-footnote">New here? <Link to="/create-account">Create an account</Link></p></form></AuthShell>;
}

function PageShell({ children, pageContext }: { children: React.ReactNode; pageContext?: PageContext }) {
  return <><Header /><main className="page-shell">{children}</main><BulldogChat pageContext={pageContext} /><footer className="site-footer"><span>Campus Customs</span><span>Yale-inspired goods for every chapter.</span></footer></>;
}

export default function App() {
  return <Routes><Route path="/" element={<HomePage />} /><Route path="/products" element={<ProductsPage />} /><Route path="/products/:productId" element={<ProductDetailPage />} /><Route path="/about" element={<SimplePage title="Made for the campus community." text="Campus Customs brings the spirit of campus into the pieces you reach for every day. Explore the collection, find your favorite, and make it yours." />} /><Route path="/login" element={<LoginPage />} /><Route path="/create-account" element={<CreateAccountPage />} /><Route path="*" element={<SimplePage title="Page not found." text="That page is not part of the collection yet." />} /></Routes>;
}
