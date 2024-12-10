import { NextRequest, NextResponse } from 'next/server';

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const BASE_DOMAIN = 'te.kg';

export async function POST(request: NextRequest) {
  try {
    const { subdomain, target } = await request.json();

    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'CNAME',
        name: `${subdomain}.${BASE_DOMAIN}`,
        content: target,
        ttl: 1,
        proxied: true,
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      return NextResponse.json(
        { message: `Поддомен ${subdomain}.${BASE_DOMAIN} создан`, result: result.result },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: result.errors },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { recordId, subdomain, target } = await request.json();

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${recordId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'CNAME',
          name: `${subdomain}.${BASE_DOMAIN}`,
          content: target,
          ttl: 1,
          proxied: true,
        }),
      }
    );

    const result = await response.json();
    
    if (result.success) {
      return NextResponse.json(
        { message: `Поддомен ${subdomain}.${BASE_DOMAIN} обновлен`, result: result.result },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: result.errors },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { recordId } = await request.json();

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${recordId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();
    
    if (result.success) {
      return NextResponse.json(
        { message: 'Поддомен удален', result: result.result },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: result.errors },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
