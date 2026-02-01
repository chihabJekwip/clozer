import { NextRequest, NextResponse } from 'next/server';

// This API route handles sending tour reports via email
// It uses the Resend API (https://resend.com)
// Set RESEND_API_KEY in your environment variables

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, htmlBody, textBody, tourId } = body;

    // Validate required fields
    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient is required' },
        { status: 400 }
      );
    }

    if (!subject || !htmlBody) {
      return NextResponse.json(
        { error: 'Subject and HTML body are required' },
        { status: 400 }
      );
    }

    // Check for API key
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not configured - simulating email send');
      
      // In development or when not configured, simulate success
      return NextResponse.json({
        success: true,
        simulated: true,
        message: `Email would be sent to ${to.length} recipient(s)`,
        recipients: to.map((r: { email: string }) => r.email),
        tourId,
      });
    }

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Clozer <rapports@clozer.app>',
        to: to.map((r: { name: string; email: string }) => r.email),
        subject,
        html: htmlBody,
        text: textBody,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      return NextResponse.json(
        { error: result.message || 'Failed to send email', details: result },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Email sent successfully to ${to.length} recipient(s)`,
      recipients: to.map((r: { email: string }) => r.email),
      emailId: result.id,
      tourId,
    });

  } catch (error) {
    console.error('Error in send-report API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  const hasApiKey = !!process.env.RESEND_API_KEY;
  
  return NextResponse.json({
    status: 'ok',
    emailConfigured: hasApiKey,
    message: hasApiKey 
      ? 'Email service is configured' 
      : 'RESEND_API_KEY not set - emails will be simulated',
  });
}
