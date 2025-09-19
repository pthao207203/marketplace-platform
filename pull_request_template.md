## ✅ Checklist tự review pull trước khi ready để trainer review (Java Spring Boot)

- [ ] Sử dụng **thụt lề 4 spaces** đồng nhất ở tất cả các files `.ts`, `.json`, `.tsx`, v.v. (cấu hình lại VSCode nếu chưa setup).
- [ ] Cuối mỗi file cần có **end line** (`\n`) để tránh lỗi đỏ khi diff trên Git.
- [ ] `.gitignore` các file nhạy cảm (VD: `.env`, `/node_modules/` ...).
- [ ] Kiểm tra mỗi pull request **chỉ có 1 commit**, nếu nhiều hơn hãy dùng `git rebase -i` để gộp commit.
- [ ] Cài đặt `Prettier`. Format lại trước khi gửi pull.
- [ ] Mỗi pull cần **ít nhất 3 APPROVED** từ thành viên khác trong nhóm.

## WHAT (optional)

- Change number items `completed/total` in admin page.

## HOW

- I edit js file, inject not_vary_normal items in calculate function.

## WHY (optional)

- Because in previous version - number just depends on `normal` items. But in new version, we have `state` and `confirm_state` depends on both `normal` + `not_normal` items.

## Evidence (Screenshot or Video)
