import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MetaService } from '../../services/meta.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="hero-section">
      <div class="container">
        <h1>Contact Us</h1>
        <p class="hero-subtitle">
          Get in touch with our team for support, partnerships, or custom solutions
        </p>
      </div>
    </div>

    <section class="contact">
      <div class="container">
        <div class="contact-grid">
          <div class="contact-info">
            <h2>Get In Touch</h2>
            <p>
              We're here to help you master AI tools and break through productivity barriers. 
              Reach out to us for any questions, feedback, or partnership opportunities.
            </p>
            
            <div class="contact-methods">
              <div class="contact-method">
                <h3>Email</h3>
                <p>hello@amysoft.tech</p>
                <p>support@amysoft.tech</p>
              </div>
              
              <div class="contact-method">
                <h3>Response Time</h3>
                <p>We typically respond within 24 hours</p>
              </div>
              
              <div class="contact-method">
                <h3>Office Hours</h3>
                <p>Monday - Friday: 9 AM - 6 PM EST</p>
                <p>Saturday: 10 AM - 4 PM EST</p>
              </div>
            </div>
          </div>

          <div class="contact-form">
            <h2>Send us a Message</h2>
            <form>
              <div class="form-group">
                <label for="name">Full Name</label>
                <input type="text" id="name" name="name" required>
              </div>
              
              <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" required>
              </div>
              
              <div class="form-group">
                <label for="subject">Subject</label>
                <select id="subject" name="subject" required>
                  <option value="">Select a topic</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="partnership">Partnership</option>
                  <option value="custom">Custom Solutions</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="message">Message</label>
                <textarea id="message" name="message" rows="5" required></textarea>
              </div>
              
              <button type="submit" class="btn btn-primary">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <section class="faq-section">
      <div class="container">
        <h2>Frequently Asked Questions</h2>
        <div class="faq-grid">
          <div class="faq-item">
            <h4>How quickly can I get started?</h4>
            <p>You can start immediately after signup. All content is available instantly.</p>
          </div>
          
          <div class="faq-item">
            <h4>Do you offer custom training for teams?</h4>
            <p>Yes, we provide custom AI training programs tailored to your team's needs.</p>
          </div>
          
          <div class="faq-item">
            <h4>What if I need help implementing the techniques?</h4>
            <p>We offer 1-on-1 coaching sessions and detailed implementation guides.</p>
          </div>
          
          <div class="faq-item">
            <h4>Can you help with specific AI tools?</h4>
            <p>Absolutely! We cover ChatGPT, Claude, Midjourney, and many other AI tools.</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero-section {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      color: white;
      padding: 4rem 0;
      text-align: center;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }

    .hero-subtitle {
      font-size: 1.3rem;
      opacity: 0.9;
    }

    .contact {
      padding: 4rem 0;
    }

    .contact-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: start;
    }

    .contact-info h2, .contact-form h2 {
      font-size: 2rem;
      color: #333;
      margin-bottom: 2rem;
    }

    .contact-info p {
      font-size: 1.1rem;
      line-height: 1.7;
      color: #666;
      margin-bottom: 2rem;
    }

    .contact-methods {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .contact-method {
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 0.5rem;
    }

    .contact-method h3 {
      color: #ff6b6b;
      margin-bottom: 0.5rem;
      font-size: 1.2rem;
    }

    .contact-method p {
      margin: 0;
      color: #666;
      font-size: 1rem;
    }

    .contact-form {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
      font-weight: 600;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #ff6b6b;
    }

    .form-group textarea {
      resize: vertical;
      min-height: 120px;
    }

    .btn {
      padding: 0.75rem 2rem;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 1rem;
    }

    .btn-primary {
      background: #ff6b6b;
      color: white;
      width: 100%;
    }

    .btn-primary:hover {
      background: #ff5252;
      transform: translateY(-2px);
    }

    .faq-section {
      padding: 4rem 0;
      background: #f8f9fa;
    }

    .faq-section h2 {
      text-align: center;
      margin-bottom: 3rem;
      font-size: 2.5rem;
      color: #333;
    }

    .faq-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .faq-item {
      background: white;
      padding: 2rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .faq-item h4 {
      color: #333;
      margin-bottom: 1rem;
      font-size: 1.2rem;
    }

    .faq-item p {
      color: #666;
      line-height: 1.6;
      margin: 0;
    }

    @media (max-width: 768px) {
      h1 {
        font-size: 2.2rem;
      }
      
      .contact-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      
      .contact-form {
        padding: 1.5rem;
      }
    }
  `]
})
export class ContactComponent implements OnInit {
  constructor(private metaService: MetaService) {}

  ngOnInit(): void {
    this.metaService.setContactPage();
  }
}