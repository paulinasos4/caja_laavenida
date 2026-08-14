import Nav from "./Nav";
import styles from "./layout.module.css";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <Nav />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
