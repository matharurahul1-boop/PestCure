import React from 'react';

export function StatusLegend({good,watch}:{good:number;watch:number}){
 const items=[
  {tone:'good',label:'On track',tip:`Achievement is ${good}% or higher.`},
  {tone:'watch',label:'Watch',tip:`Achievement is between ${watch}% and ${good-1}%.`},
  {tone:'support',label:'Support',tip:`Achievement is below ${watch}%. Check the task breakdown.`},
  {tone:'neutral',label:'Unscored',tip:'Targets are unapproved or a scored result is unavailable.'}
 ];
 return <div className="status-legend" aria-label="Performance color guide">{items.map(item=><span className="legend-help" tabIndex={0} key={item.tone} data-tip={item.tip}><i className={`status-dot ${item.tone}`}/>{item.label}</span>)}</div>;
}
