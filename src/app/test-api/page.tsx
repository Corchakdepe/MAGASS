'use client';
import { useEffect, useState } from 'react';

export default function TestAPI() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/zones/")
      .then(res => res.json())
      .then(json => {
        console.log("API Response:", json);
        setData(json);
      })
      .catch(err => console.error("Error fetching:", err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Test API</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
