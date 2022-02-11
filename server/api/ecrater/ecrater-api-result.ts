export function ecraterAPIResult(res) {
    let isDoneRequest = false
    function c(message, error = 0) {
        return function (data?) {
            if (isDoneRequest) return
            isDoneRequest = true
            return res.json({ error, message, data }).end()
        }
    }
    return {
        authorization: c('Lỗi khi xác thực người dùng', -997),
        initCookies: c('Chờ khởi tạo cookie', 1),
        proxy: c('Lỗi proxy', 1),
        deathUser: c('Phiên đăng nhập không hợp lệ', 99),
        error: c('Đã có lỗi xảy ra', 1),
        success: c('Thành công', 0),
        requrieProxy: c('Proxy chưa được thiết lập'),
        wrongData: c('Dữ liệu bị sai')
    }
}