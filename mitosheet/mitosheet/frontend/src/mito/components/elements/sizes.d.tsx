/* 
    Different size types for common elements
*/

export type Height = 'small' | 'medium' | 'large' | 'block';
export type Width = 'small' | 'medium' | 'medium-large' | 'large' |  'block';


// Must match CSS pixel values
export const WIDTH_MAPPING = {
    'small': 100,
    'medium': 170,
    'medium-large': 250,
    'large': 345
}
