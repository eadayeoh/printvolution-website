import 'server-only';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Strip script / event-handler / javascript: / embed / iframe from any
 * HTML that we either import from 3rd parties or render with
 * dangerouslySetInnerHTML. Run on INGRESS (blog importer, admin save)
 * and/or RENDER, defence-in-depth.
 */
const ALLOWED_TAGS = [
  'p','br','hr','strong','em','b','i','u','s','strike','sup','sub',
  'h1','h2','h3','h4','h5','h6',
  'a','ul','ol','li','dl','dt','dd',
  'blockquote','q','pre','code','kbd','samp',
  'table','thead','tbody','tr','td','th','caption',
  'img','figure','figcaption',
  'span','div',
  'details','summary',
];
const ALLOWED_ATTR = ['href','title','alt','src','srcset','width','height','class','id','target','rel','colspan','rowspan','cite'];

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[/#])/i,
    FORBID_TAGS: ['script','style','iframe','object','embed','form','input','textarea','select','button','link','meta','svg','math'],
    FORBID_ATTR: ['onload','onerror','onclick','onmouseover','onfocus','onblur','onsubmit','onchange','onkeydown','onkeyup','onkeypress','formaction','srcdoc'],
    KEEP_CONTENT: true,
    // Don't allow data: / javascript: URIs at all
    ADD_URI_SAFE_ATTR: [],
  });
}
