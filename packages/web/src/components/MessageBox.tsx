import { ReactNode } from 'react';

export default function MessageBox({ children }: { children: ReactNode }) {
  return (
    <div className="bg-primary text-text-white w-[50%] h-full rounded-md p-5">
      {children
        ?.toString()
        .split('<br>')
        .map((s) => <div key={s}>{s}</div>)}
    </div>
  );
}
