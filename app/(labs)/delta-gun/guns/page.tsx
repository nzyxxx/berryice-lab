import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { guns } from "@/data/guns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function GunsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="fixed top-6 left-6 z-50">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/delta-gun">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回实验室
          </Link>
        </Button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">枪械库</h1>
        <p className="text-zinc-400 mb-10">共 {guns.length} 把可改装枪械</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {guns.map((gun) => (
            <Link key={gun.id} href={`/delta-gun/guns/${gun.id}`}>
              <Card className="bg-zinc-900 border-zinc-700 hover:border-orange-500 transition-all hover:scale-105">
                <CardHeader>
                  <CardTitle className="text-zinc-100">{gun.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-400">{gun.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}