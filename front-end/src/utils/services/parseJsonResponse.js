// Khi route không tồn tại (404 mặc định của Express) hoặc server sập, body trả về là HTML.
// res.json() khi đó throw SyntaxError kiểu "Unexpected token '<'" rất khó lần ra nguyên nhân,
// nên đọc text trước rồi parse có kiểm soát để báo kèm HTTP status.
const parseJsonResponse = async (res) => {
    const text = await res.text();

    try {
        return JSON.parse(text);
    } catch {
        throw new Error(`Server returned an unexpected response (HTTP ${res.status}). Please try again later!`);
    }
};

export default parseJsonResponse;
