import React, { useRef } from "react";
import { ReportInterface, ReportResultInterface } from "../../interfaces";
import { DisplayBox, ExportLink, Loading } from "../"
import { ApiHelper } from "../../helpers"
import { useReactToPrint } from "react-to-print";
import { TableReport } from "./TableReport";
import { ChartReport } from "./ChartReport";
import { TreeReport } from "./TreeReport";
import { Icon } from "@mui/material";
import useMountedState from "../../hooks/useMountedState";

interface Props { report: ReportInterface }

export const ReportOutput = (props: Props) => {
  const [reportResult, setReportResult] = React.useState<ReportResultInterface>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isMounted = useMountedState();

  const handlePrint = useReactToPrint({
    content: () => contentRef.current
  })

  const runReport = () => {
    if (props.report) {
      const queryParams: string[] = [];
      props.report.parameters.forEach(p => {
        if (p.value) queryParams.push(p.keyName + "=" + p.value);
      });
      let url = "/reports/" + props.report.keyName + "/run";
      if (queryParams) url += "?" + queryParams.join("&");

      ApiHelper.get(url, "ReportingApi").then((data: ReportResultInterface) => {
        if(isMounted()) {
          setReportResult(data);
        }
      });
    }
  }

  React.useEffect(runReport, [props.report, isMounted]);

  const getEditContent = () => {
    const result: JSX.Element[] = [];

    if (reportResult) {
      result.push(<button type="button" className="no-default-style" key={result.length - 2} onClick={handlePrint} title="print"><Icon>print</Icon></button>);
      result.push(<ExportLink key={result.length - 1} data={reportResult.table} filename={props.report.displayName.replace(" ", "_") + ".csv"} />);
    }
    return result;
  }

  const getOutputs = () => {
    const result: JSX.Element[] = [];
    reportResult.outputs.forEach(o => {
      if (o.outputType === "table") result.push(<TableReport key={o.outputType} reportResult={reportResult} output={o} />)
      if (o.outputType === "tree") result.push(<TreeReport key={o.outputType} reportResult={reportResult} output={o} />)
      else if (o.outputType === "barChart") result.push(<ChartReport key={o.outputType} reportResult={reportResult} output={o} />)
    })

    return result;
  }

  const getResults = () => {
    if (!props.report) return (<DisplayBox ref={contentRef} id="reportsBox" headerIcon="summarize" headerText="Run Report" editContent={getEditContent()}><p>Use the filter to run the report.</p></DisplayBox>);

    else if (!reportResult) return <Loading />
    else {
      return (<DisplayBox ref={contentRef} id="reportsBox" headerIcon="summarize" headerText={props.report.displayName} editContent={getEditContent()}>
        {getOutputs()}
      </DisplayBox>);
    }
  }

  return (
    <>
      {getResults()}
    </>
  );
}
