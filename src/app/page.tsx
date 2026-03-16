import GameBoard from '@/components/GameBoard';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Tic Tac Toe</h1>
      <GameBoard />
    </main>
  );
}
