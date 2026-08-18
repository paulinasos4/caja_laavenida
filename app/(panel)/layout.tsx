import Nav from "./Nav";
import styles from "./layout.module.css";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <p className={styles.mobileBrand}>La Avenida</p>
      <Nav />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
