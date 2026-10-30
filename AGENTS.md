<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Enforce archive account eligibility and verified moderator authority with database triggers and role checks; browser checks are only user feedback.
- Miscellaneous resources use a reserved MISC course container plus a section discriminator, preserving existing required course references; exclude that container from course browsing.
- Store tags on resources and reports in their own RLS-protected table so moderator decisions do not alter public visibility automatically.
- Keep course filtering and pagination in a shared browser-safe module; browse and upload use the same subject ordering so catalogue organisation stays consistent.
