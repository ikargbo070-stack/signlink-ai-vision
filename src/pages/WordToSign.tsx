import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Search } from "lucide-react";
import aslHello from "@/assets/asl-hello.png";
import aslILoveYou from "@/assets/asl-iloveyou.png";
import aslMe from "@/assets/asl-me.png";
import aslMy from "@/assets/asl-my.png";
import aslSit from "@/assets/asl-sit.png";

const ASL_SIGNS: Record<string, string> = {
  hello: aslHello,
  "i love you": aslILoveYou,
  me: aslMe,
  my: aslMy,
  sit: aslSit,
};

const WordToSign = () => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [translatedSigns, setTranslatedSigns] = useState<Array<{ word: string; image: string }>>([]);

  const handleTranslate = () => {
    const normalized = inputText.toLowerCase().trim();
    
    if (ASL_SIGNS[normalized]) {
      setTranslatedSigns([{ word: normalized, image: ASL_SIGNS[normalized] }]);
    } else {
      const words = normalized.split(" ");
      const signs = words
        .map((word) => {
          if (ASL_SIGNS[word]) {
            return { word, image: ASL_SIGNS[word] };
          }
          const multiWord = words.join(" ");
          if (ASL_SIGNS[multiWord]) {
            return { word: multiWord, image: ASL_SIGNS[multiWord] };
          }
          return null;
        })
        .filter((sign): sign is { word: string; image: string } => sign !== null);
      
      setTranslatedSigns(signs.length > 0 ? signs : []);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTranslate();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Word to Sign Translation
            </h1>
            <p className="text-muted-foreground">
              Type a word and see its ASL sign representation
            </p>
          </div>

          <Card className="p-6 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type a word (hello, i love you, me, my, sit)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleTranslate}>
                <Search className="h-4 w-4 mr-2" />
                Translate
              </Button>
            </div>

            {translatedSigns.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {translatedSigns.map((sign, index) => (
                  <Card key={index} className="p-4 space-y-2">
                    <img
                      src={sign.image}
                      alt={`ASL sign for ${sign.word}`}
                      className="w-full h-48 object-contain"
                    />
                    <p className="text-center font-semibold text-lg capitalize">
                      {sign.word}
                    </p>
                  </Card>
                ))}
              </div>
            )}

            {inputText && translatedSigns.length === 0 && (
              <p className="text-center text-muted-foreground mt-4">
                No ASL sign found for "{inputText}". Try: hello, i love you, me, my, or sit
              </p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Available Words</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.keys(ASL_SIGNS).map((word) => (
                <Button
                  key={word}
                  variant="outline"
                  onClick={() => {
                    setInputText(word);
                    setTranslatedSigns([{ word, image: ASL_SIGNS[word] }]);
                  }}
                  className="capitalize"
                >
                  {word}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WordToSign;
