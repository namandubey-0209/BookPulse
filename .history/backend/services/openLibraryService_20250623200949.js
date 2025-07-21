import axios from 'axios';

const BASE_URL = 'https://openlibrary.org';

class OpenLibraryService {
    async searchBooks(query, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;
            const response = await axios.get(`${BASE_URL}/search.json`, {
                params: {
                    q: query,
                    limit,
                    offset,
                    fields: 'key,title,author_name,isbn,first_publish_year,number_of_pages_median,subject,cover_i'
                }
            });

            const books = response.data.docs.map(book => ({
                openLibraryId: book.key,
                title: book.title,
                authors: book.author_name || [],
                isbn: book.isbn?.[0],
                publishedDate: book.first_publish_year?.toString(),
                pageCount: book.number_of_pages_median || 0,
                genres: book.subject ? book.subject.slice(0, 5) : [],
                coverImage: book.cover_i ? 
                    `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null
            }));

            return {
                books,
                total: response.data.numFound,
                page: parseInt(page),
                totalPages: Math.ceil(response.data.numFound / limit)
            };
        } catch (error) {
            throw new Error(`Error searching Open Library: ${error.message}`);
        }
    }

    async getBookDetails(openLibraryId) {
        try {
            const response = await axios.get(`${BASE_URL}${openLibraryId}.json`);
            return response.data;
        } catch (error) {
            throw new Error(`Error fetching book details: ${error.message}`);
        }
    }
}

export default new OpenLibraryService();