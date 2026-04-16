const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Send email function
const sendEmail = async (to, subject, html) => {
    try {
        // Check if email credentials are configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log('⚠️ Email not configured. Skipping email notification.');
            return false;
        }

        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"Lost & Found System" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return false;
    }
};

// Email templates
const emailTemplates = {
    // Welcome email after registration
    welcome: (userName) => {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px;">
                <div style="background: white; padding: 30px; border-radius: 15px;">
                    <h2 style="color: #4361ee; margin-bottom: 20px;">
                        🎉 Welcome to Lost & Found!
                    </h2>
                    <p style="font-size: 16px; color: #333;">Hello <strong>${userName}</strong>,</p>
                    <p style="font-size: 16px; color: #333;">Thank you for joining our Lost & Found community! You can now:</p>
                    <ul style="font-size: 16px; color: #333;">
                        <li>📦 Post lost items</li>
                        <li>🎁 Report found items</li>
                        <li>🔍 Search and filter items</li>
                        <li>📌 Claim items that belong to you</li>
                    </ul>
                    <p style="font-size: 16px; color: #333;">We hope you find what you're looking for!</p>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 14px;">Best regards,<br>Lost & Found System Team</p>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Item approved notification
    itemApproved: (userName, itemName) => {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border-radius: 20px;">
                <div style="background: white; padding: 30px; border-radius: 15px;">
                    <h2 style="color: #11998e; margin-bottom: 20px;">
                        ✅ Item Approved!
                    </h2>
                    <p style="font-size: 16px; color: #333;">Hello <strong>${userName}</strong>,</p>
                    <p style="font-size: 16px; color: #333;">Great news! Your item "<strong>${itemName}</strong>" has been approved and is now publicly visible.</p>
                    <p style="font-size: 16px; color: #333;">Other users can now see and claim your item if they find it.</p>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 14px;">Best regards,<br>Lost & Found System Team</p>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Item rejected notification
    itemRejected: (userName, itemName) => {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); border-radius: 20px;">
                <div style="background: white; padding: 30px; border-radius: 15px;">
                    <h2 style="color: #eb3349; margin-bottom: 20px;">
                        ❌ Item Not Approved
                    </h2>
                    <p style="font-size: 16px; color: #333;">Hello <strong>${userName}</strong>,</p>
                    <p style="font-size: 16px; color: #333;">Unfortunately, your item "<strong>${itemName}</strong>" could not be approved.</p>
                    <p style="font-size: 16px; color: #333;">This might be due to incomplete information or violation of our guidelines.</p>
                    <p style="font-size: 16px; color: #333;">You can submit a new item with more details.</p>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 14px;">Best regards,<br>Lost & Found System Team</p>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Claim submitted notification
    claimSubmitted: (userName, itemName) => {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px;">
                <div style="background: white; padding: 30px; border-radius: 15px;">
                    <h2 style="color: #4361ee; margin-bottom: 20px;">
                        📌 Claim Submitted Successfully
                    </h2>
                    <p style="font-size: 16px; color: #333;">Hello <strong>${userName}</strong>,</p>
                    <p style="font-size: 16px; color: #333;">Your claim for "<strong>${itemName}</strong>" has been submitted and is pending admin review.</p>
                    <p style="font-size: 16px; color: #333;">We will notify you once the admin makes a decision.</p>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 14px;">Best regards,<br>Lost & Found System Team</p>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Claim status update
    claimStatusUpdate: (userName, itemName, status) => {
        const isApproved = status === 'approved';
        const titleColor = isApproved ? '#11998e' : '#eb3349';
        const emoji = isApproved ? '✅' : '❌';
        const statusText = isApproved ? 'Approved' : 'Not Approved';
        
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, ${isApproved ? '#11998e, #38ef7d' : '#eb3349, #f45c43'}); border-radius: 20px;">
                <div style="background: white; padding: 30px; border-radius: 15px;">
                    <h2 style="color: ${titleColor}; margin-bottom: 20px;">
                        ${emoji} Claim ${statusText}
                    </h2>
                    <p style="font-size: 16px; color: #333;">Hello <strong>${userName}</strong>,</p>
                    <p style="font-size: 16px; color: #333;">Your claim for "<strong>${itemName}</strong>" has been <strong>${status}</strong>.</p>
                    ${isApproved ? 
                        '<p style="font-size: 16px; color: #333;">Please contact the item poster to arrange pickup.</p>' : 
                        '<p style="font-size: 16px; color: #333;">The admin has determined that this item does not belong to you.</p>'
                    }
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 14px;">Best regards,<br>Lost & Found System Team</p>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Someone claimed your item
    itemClaimed: (ownerName, itemName, claimantName) => {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px;">
                <div style="background: white; padding: 30px; border-radius: 15px;">
                    <h2 style="color: #4361ee; margin-bottom: 20px;">
                        📢 Someone Claimed Your Item
                    </h2>
                    <p style="font-size: 16px; color: #333;">Hello <strong>${ownerName}</strong>,</p>
                    <p style="font-size: 16px; color: #333;"><strong>${claimantName}</strong> has submitted a claim for your item "<strong>${itemName}</strong>".</p>
                    <p style="font-size: 16px; color: #333;">The claim is pending admin review. We will notify you once it's approved.</p>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 14px;">Best regards,<br>Lost & Found System Team</p>
                    </div>
                </div>
            </div>
        `;
    }
};

module.exports = { sendEmail, emailTemplates };