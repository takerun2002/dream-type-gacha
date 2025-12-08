import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const userName = formData.get("userName") as string;
    const cardImage = formData.get("cardImage") as File;

    if (!email || !cardImage) {
      return NextResponse.json(
        { success: false, error: "メールアドレスとカード画像が必要です" },
        { status: 400 }
      );
    }

    // メール送信設定（環境変数から取得、なければデフォルト）
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // カード画像をBase64に変換
    const arrayBuffer = await cardImage.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    // メール送信
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `【${userName}さん】あなたのきんまんカードができました！`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: "Hiragino Sans", "Meiryo", sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 30px;
              border-radius: 10px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .card-image {
              text-align: center;
              margin: 30px 0;
            }
            .card-image img {
              max-width: 100%;
              height: auto;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .message {
              margin: 20px 0;
              padding: 20px;
              background-color: #f9f9f9;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #999;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #c94b7c;">✨ あなたのきんまんカード ✨</h1>
              <p>${userName}さん、診断お疲れ様でした！</p>
            </div>
            
            <div class="message">
              <p>この度は「夢タイプ診断ガチャ」にご参加いただき、ありがとうございました。</p>
              <p>あなただけの特別なきんまんカードをお送りします。</p>
            </div>
            
            <div class="card-image">
              <img src="data:image/png;base64,${base64Image}" alt="きんまんカード" />
            </div>
            
            <div class="message">
              <p>このカードは、あなたの夢タイプ診断結果を元に作成された、世界に1枚だけのオリジナルカードです。</p>
              <p>ぜひ保存して、引き寄せノートと一緒に大切にしてくださいね。</p>
            </div>
            
            <div class="footer">
              <p>Date with Dream Note © 2025</p>
              <p>きんまん先生の1DAYライブ授業でお会いしましょう！</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `kinman-card-${userName}.png`,
          content: buffer,
          cid: "card-image",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "メールを送信しました",
    });
  } catch (error) {
    console.error("メール送信エラー:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "メール送信に失敗しました",
        details: error instanceof Error ? error.message : "不明なエラー"
      },
      { status: 500 }
    );
  }
}
















