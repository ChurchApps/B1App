import { Icon } from "@mui/material";
import { DisplayBox } from "@/components";
import { B1PageInterface } from "@/helpers";

interface Props {
  pages: B1PageInterface[];
  addFunction?: () => void;
  editFunction?: (page: B1PageInterface) => void;
}

export function PageList({ pages = [], addFunction = () => {}, editFunction = () => {} }: Props) {
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addFunction();
  };

  const editContent = (
    <a href="about:blank" onClick={handleAdd}>
      <Icon>add</Icon>
    </a>
  );

  return (
    <DisplayBox headerIcon="code" headerText="Pages" editContent={editContent}>
      <table className="table">
        <tbody>
          {pages.length === 0 ? (
            <tr>
              <td>
                Pages are small pieces of information that you can include add as a tab in the B1 app. Click the plus
                icon to add a page.
              </td>
            </tr>
          ) : (
            pages.map((page) => (
              <tr key={page.id}>
                <td>{page.name}</td>
                <td style={{ textAlign: "right" }}>
                  <a
                    href="about:blank"
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      editFunction(page);
                    }}
                  >
                    <Icon>edit</Icon>
                  </a>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </DisplayBox>
  );
}
